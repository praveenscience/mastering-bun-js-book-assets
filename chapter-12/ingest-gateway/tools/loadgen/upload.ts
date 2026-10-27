// Writes N events as NDJSON (the format of Chapter 7) and streams
// the file to POST /v1/events/ndjson.
// Usage: bun upload.ts <events> [url]   (IGW_KEY must be set)
import { tmpdir } from "node:os";
import { join } from "node:path";

const count = Number(Bun.argv[2] ?? 1_000_000);
const url = Bun.argv[3] ?? "http://127.0.0.1:8080";
const path = join(tmpdir(), `igw-upload-${process.pid}.ndjson`);
const types = ["page.view", "click", "search", "order.paid"];
const run = Date.now().toString(36);

const writer = Bun.file(path).writer({ highWaterMark: 1 << 20 });
for (let i = 0; i < count; i++) {
  const event = {
    id: `${run}-${i}`,
    ts: Date.now(),
    type: types[i % types.length],
    user: `u${(i * 7919) % 50_000}`,
    ms: i % 2000,
  };
  writer.write(JSON.stringify(event) + "\n");
}
await writer.end();
const bytes = Bun.file(path).size;

const started = performance.now();
const res = await fetch(`${url}/v1/events/ndjson`, {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.IGW_KEY}` },
  body: Bun.file(path), // streamed from disk, not read into memory
});
const seconds = (performance.now() - started) / 1000;
const summary = await res.json();
console.log(
  JSON.stringify({
    status: res.status,
    megabytes: +(bytes / 1e6).toFixed(1),
    seconds: +seconds.toFixed(2),
    eventsPerSecond: Math.round(summary.accepted / seconds),
    accepted: summary.accepted,
    rejected: summary.rejected.length,
  }),
);
await Bun.file(path).delete();
