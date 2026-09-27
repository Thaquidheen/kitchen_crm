import type { Timers } from '../core/reconnect';

/** Deterministic Timers for tests: advance() runs due callbacks in order. */
export class FakeTimers implements Timers {
  private t = 0;
  private seq = 0;
  private queue: { id: number; at: number; fn: () => void }[] = [];

  now(): number {
    return this.t;
  }

  setTimeout(fn: () => void, ms: number): unknown {
    const id = ++this.seq;
    this.queue.push({ id, at: this.t + ms, fn });
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.queue = this.queue.filter((q) => q.id !== handle);
  }

  get pending(): number {
    return this.queue.length;
  }

  /** Advance the clock, running callbacks (and letting their promises settle) as they fall due. */
  async advance(ms: number): Promise<void> {
    const end = this.t + ms;
    for (;;) {
      this.queue.sort((a, b) => a.at - b.at || a.id - b.id);
      const next = this.queue[0];
      if (!next || next.at > end) {
        break;
      }
      this.queue.shift();
      this.t = next.at;
      next.fn();
      await flush();
    }
    this.t = end;
    await flush();
  }
}

export const flush = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

export class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}
