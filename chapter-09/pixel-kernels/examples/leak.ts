// Calls describe() a million times per round, with and without
// free_string. Run: bun examples/leak.ts [free]
import { CString } from "bun:ffi";
import { kernels } from "../src/native";

const pixels = new Uint8Array(4 * 4 * 4);
const free = process.argv[2] === "free";
const rss = () => (process.memoryUsage().rss / 2 ** 20).toFixed(0);

console.log(`free_string: ${free ? "yes" : "no"}, start ${rss()} MB`);
for (let round = 1; round <= 5; round++) {
  for (let i = 0; i < 1_000_000; i++) {
    const p = kernels.symbols.describe(pixels, 4, 4)!;
    new CString(p).toString();
    if (free) kernels.symbols.free_string(p);
  }
  Bun.gc(true);
  console.log(`${round}M calls: ${rss()} MB`);
}
