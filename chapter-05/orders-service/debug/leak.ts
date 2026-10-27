import { heapStats } from "bun:jsc";

// A "cache" of rendered receipts, keyed by request ID. Every request
// has a new ID, so nothing is ever read back and nothing is removed.
const cache = new Map<string, string>();
const limit = Number(process.argv[2] ?? 0); // 0 means no limit

function handle(requestId: string) {
  const receipt = `Receipt ${requestId}\n`.repeat(20);
  cache.set(requestId, receipt);
  if (limit && cache.size > limit) {
    // Map keeps insertion order, so the first key is the oldest.
    cache.delete(cache.keys().next().value!);
  }
  return receipt.length;
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
for (let round = 1; round <= 5; round++) {
  for (let i = 0; i < 50_000; i++) handle(crypto.randomUUID());
  Bun.gc(true); // collect garbage first, so we see what really stays
  const { heapSize, objectCount } = heapStats();
  console.log(
    `after ${round * 50}k requests: heap ${mb(heapSize)} MB,`,
    `${objectCount} objects, cache ${cache.size}`,
  );
}
