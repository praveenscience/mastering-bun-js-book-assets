// Remembers recent event ids, so a client that retries a POST does
// not deliver the same event twice. Bounded twice over: ids expire
// after ttlMs, and at most `max` ids are kept.
export interface Dedupe {
  seen(id: string): boolean;
  readonly size: number;
}

export class RecentIds implements Dedupe {
  private ids = new Map<string, number>(); // id -> expiry time

  constructor(
    private ttlMs: number,
    private max: number,
    private now = Date.now,
  ) {}

  seen(id: string): boolean {
    const now = this.now();
    // Every id has the same ttl, so insertion order is expiry order.
    for (const [old, expires] of this.ids) {
      if (expires > now) break;
      this.ids.delete(old);
    }
    if (this.ids.has(id)) return true;
    this.ids.set(id, now + this.ttlMs);
    if (this.ids.size > this.max) {
      this.ids.delete(this.ids.keys().next().value!);
    }
    return false;
  }

  get size() {
    return this.ids.size;
  }
}
