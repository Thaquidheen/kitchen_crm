/** Minimal typed event emitter (no dependency on DOM EventTarget, so it runs in tests). */

export type Listener<T> = (payload: T) => void;

export class Emitter<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    let set = this.listeners[event];
    if (!set) {
      set = new Set();
      this.listeners[event] = set;
    }
    set.add(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    this.listeners[event]?.delete(fn);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // Copy so a listener unsubscribing itself mid-emit doesn't skip its neighbour.
    for (const fn of Array.from(this.listeners[event] ?? [])) {
      try {
        fn(payload);
      } catch (e) {
        console.error(`[laser-meter] "${String(event)}" listener failed`, e);
      }
    }
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners[event]?.size ?? 0;
  }
}
