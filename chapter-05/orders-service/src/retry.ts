// Retries fn with exponential backoff: 100 ms, 200 ms, 400 ms...
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseMs = 100,
): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i + 1 >= attempts) throw err;
      const wait = baseMs * 2 ** i;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
