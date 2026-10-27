import { rename } from "node:fs/promises";

// One function writes strings, bytes, files, and responses.
await Bun.write("data/hello.txt", "Hello, Bun\n");
await Bun.write("data/bytes.bin", new Uint8Array([1, 2, 3]));

// File to file: on macOS a new file is a copy-on-write clone.
let t = performance.now();
await Bun.write(
  "data/events-copy.ndjson",
  Bun.file("data/events.ndjson"),
);
console.log(`copy: ${(performance.now() - t).toFixed(1)} ms`);

// Many small writes: use a FileSink, which buffers them for you.
const sink = Bun.file("data/numbers.txt").writer();
for (let i = 1; i <= 100_000; i++) sink.write(`${i}\n`);
await sink.end();

// Safe overwrite: write a temporary file, then rename it into place.
// Readers see the old file or the new one, never half of each.
t = performance.now();
const report = JSON.stringify({
  generatedAt: new Date().toISOString(),
});
await Bun.write("data/report.json.tmp", report);
await rename("data/report.json.tmp", "data/report.json");
console.log(`atomic write: ${(performance.now() - t).toFixed(1)} ms`);
