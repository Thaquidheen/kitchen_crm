/**
 * Reconnect backoff: try at 1s, 2s, 5s, 10s after a drop, then give up and leave it to the
 * user (a Reconnect button). Timers are injectable so the schedule is unit-testable.
 */

export const DEFAULT_RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000];

export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  now(): number;
}

export const realTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export interface ReconnectCallbacks {
  /** An attempt is scheduled: attempt is 1-based, at is epoch ms. */
  onScheduled(attempt: number, at: number): void;
  /** Perform one attempt; resolve true on success. */
  attempt(attempt: number): Promise<boolean>;
  onSucceeded(): void;
  /** All automatic attempts used up. */
  onGaveUp(): void;
}

export class ReconnectScheduler {
  private handle: unknown = null;
  private attemptNo = 0;
  private running = false;

  private readonly cb: ReconnectCallbacks;
  private readonly delays: number[];
  private readonly timers: Timers;

  constructor(
    cb: ReconnectCallbacks,
    delays: number[] = DEFAULT_RECONNECT_DELAYS_MS,
    timers: Timers = realTimers
  ) {
    this.cb = cb;
    this.delays = delays;
    this.timers = timers;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    this.cancel();
    this.running = true;
    this.attemptNo = 0;
    this.scheduleNext();
  }

  cancel(): void {
    if (this.handle !== null) {
      this.timers.clearTimeout(this.handle);
      this.handle = null;
    }
    this.running = false;
  }

  private scheduleNext(): void {
    if (!this.running) {
      return;
    }
    if (this.attemptNo >= this.delays.length) {
      this.running = false;
      this.cb.onGaveUp();
      return;
    }
    const delay = this.delays[this.attemptNo];
    this.attemptNo += 1;
    const n = this.attemptNo;
    this.cb.onScheduled(n, this.timers.now() + delay);
    this.handle = this.timers.setTimeout(async () => {
      this.handle = null;
      if (!this.running) {
        return;
      }
      let ok = false;
      try {
        ok = await this.cb.attempt(n);
      } catch {
        ok = false;
      }
      if (!this.running) {
        return;
      }
      if (ok) {
        this.running = false;
        this.cb.onSucceeded();
      } else {
        this.scheduleNext();
      }
    }, delay);
  }
}
