// A token bucket: each socket may send `burst` messages at once,
// refilled at `perSecond` messages per second.
export function createBucket(perSecond: number, burst: number) {
  let tokens = burst;
  let last = performance.now();
  return () => {
    const now = performance.now();
    tokens = Math.min(
      burst,
      tokens + ((now - last) / 1000) * perSecond,
    );
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

// Counts open connections per user.
export function createConnectionCounter(max: number) {
  const open = new Map<string, number>();
  return {
    tryOpen(user: string) {
      const n = open.get(user) ?? 0;
      if (n >= max) return false;
      open.set(user, n + 1);
      return true;
    },
    close(user: string) {
      const n = (open.get(user) ?? 1) - 1;
      if (n === 0) open.delete(user);
      else open.set(user, n);
    },
  };
}
