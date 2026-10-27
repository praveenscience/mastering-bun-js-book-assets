// Writes a large NDJSON file of synthetic analytics events, one JSON
// object per line. Usage: bun scripts/make-events.ts <lines> <file>
const lines = Number(process.argv[2] ?? 1_000_000);
const path = process.argv[3] ?? "data/events.ndjson";
const types = ["view", "click", "search", "purchase"];

const writer = Bun.file(path).writer({ highWaterMark: 1024 * 1024 });
let seed = 42; // a fixed seed, so every run writes the same file
const random = () =>
  (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;

for (let i = 0; i < lines; i++) {
  const event = {
    id: i + 1,
    ts: 1_790_000_000_000 + i * 50,
    type: types[Math.floor(random() * types.length)],
    user: `u${Math.floor(random() * 50_000)}`,
    ms: Math.floor(random() * 2000),
  };
  writer.write(JSON.stringify(event) + "\n");
}
await writer.end();
console.log(
  `wrote ${lines} events (${Bun.file(path).size} bytes) to ${path}`,
);
