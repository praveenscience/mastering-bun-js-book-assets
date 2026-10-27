// Closed-loop benchmark of one URL: `concurrency` clients each send
// a request as soon as the previous answer arrives.
// Usage: bun bench.ts <url> [seconds] [concurrency]
const [url, seconds = "5", concurrency = "16"] = Bun.argv.slice(2);
if (!url) throw new Error("usage: bun bench.ts <url> [s] [c]");

const latencies: number[] = [];
let failures = 0;
const end = performance.now() + Number(seconds) * 1000;

async function client() {
  while (performance.now() < end) {
    const start = performance.now();
    const res = await fetch(url!);
    await res.arrayBuffer();
    if (!res.ok) failures++;
    latencies.push(performance.now() - start);
  }
}
await Promise.all(
  Array.from({ length: Number(concurrency) }, () => client()),
);

latencies.sort((a, b) => a - b);
const p = (q: number) => latencies[Math.floor(q * latencies.length)]!;
const rate = latencies.length / Number(seconds);
console.log(
  `${rate.toFixed(0)} req/s  p50 ${p(0.5).toFixed(2)} ms` +
    `  p99 ${p(0.99).toFixed(2)} ms  failures ${failures}`,
);
