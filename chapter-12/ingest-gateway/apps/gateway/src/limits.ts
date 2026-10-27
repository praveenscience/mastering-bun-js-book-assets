// Token buckets per API key (Chapter 6 used one per socket). Each
// event costs one token, so a batch of 500 costs 500.
type Bucket = { tokens: number; last: number };

export class RateLimiter {
  private buckets = new Map<number, Bucket>();

  // Returns 0 if the events may pass, otherwise the milliseconds to
  // wait before enough tokens are available.
  take(
    key: { id: number; per_second: number; burst: number },
    cost: number,
    now = performance.now(),
  ): number {
    const b = this.buckets.get(key.id) ?? {
      tokens: key.burst,
      last: now,
    };
    b.tokens = Math.min(
      key.burst,
      b.tokens + ((now - b.last) / 1000) * key.per_second,
    );
    b.last = now;
    this.buckets.set(key.id, b);
    if (cost > key.burst) return Infinity; // can never pass
    if (b.tokens >= cost) {
      b.tokens -= cost;
      return 0;
    }
    return Math.ceil(((cost - b.tokens) / key.per_second) * 1000);
  }
}
