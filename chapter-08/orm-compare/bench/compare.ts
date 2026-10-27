// Runs the same work against each store: bulk inserts, an aggregate,
// and many single-row lookups. Usage: bun bench/compare.ts [raw|...]
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makers } from "../src/stores";

const ROWS = 100_000;
const BATCH = 1_000;
const LOOKUPS = 10_000;
const types = ["view", "click", "search", "purchase"];
const rows = Array.from({ length: ROWS }, (_, i) => ({
  ts: 1_790_000_000_000 + i,
  type: types[i % 4]!,
  userId: `u${i % 5000}`,
  ms: i % 2000,
}));

const perSecond = (n: number, ms: number) =>
  Math.round(n / (ms / 1000)).toLocaleString("en-GB");

async function time(work: () => Promise<unknown>) {
  const start = performance.now();
  await work();
  return performance.now() - start;
}

const dir = mkdtempSync(join(tmpdir(), "orm-bench-"));
for (const name of process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(makers)) {
  const store = await makers[name]!(join(dir, `${name}.db`));
  const insert = await time(async () => {
    for (let i = 0; i < ROWS; i += BATCH) {
      await store.insertBatch(rows.slice(i, i + BATCH));
    }
  });
  const aggregate = await time(async () => {
    for (let i = 0; i < 20; i++) await store.countByType();
  });
  const lookups = await time(async () => {
    for (let i = 1; i <= LOOKUPS; i++) await store.findById(i * 7);
  });
  await store.close();
  console.log(
    `${store.name.padEnd(11)}`,
    `insert ${perSecond(ROWS, insert)} rows/s,`,
    `aggregate ${(aggregate / 20).toFixed(1)} ms,`,
    `lookup ${((lookups * 1000) / LOOKUPS).toFixed(1)} µs`,
  );
}
rmSync(dir, { recursive: true });
