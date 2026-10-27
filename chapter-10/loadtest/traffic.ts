// Sends a steady mix of report requests through the router for a
// number of seconds and prints status codes and latency once per
// second. Usage: bun traffic.ts [seconds] [concurrency]
const BASE = process.env.BASE ?? "http://127.0.0.1:3000";
const seconds = Number(Bun.argv[2] ?? 30);
const concurrency = Number(Bun.argv[3] ?? 16);

const paths = [
  "/reports/revenue?from=2025-03-01&to=2025-03-31",
  "/reports/revenue?from=2025-06-01&to=2025-06-07",
  "/reports/revenue?from=2025-01-01&to=2025-12-31",
  "/reports/revenue?from=last-week",
  "/health",
];

let window: number[] = [];
const statuses: Record<string, number> = {};
const end = Date.now() + seconds * 1000;

async function worker(id: number) {
  for (let i = id; Date.now() < end; i += concurrency) {
    const path = paths[i % paths.length]!;
    const start = performance.now();
    let status = "error";
    try {
      const res = await fetch(BASE + path, {
        headers: { authorization: `Bearer user-${i % 500}` },
      });
      await res.arrayBuffer();
      status = String(res.status);
    } catch {}
    window.push(performance.now() - start);
    statuses[status] = (statuses[status] ?? 0) + 1;
  }
}

const timer = setInterval(() => {
  const sorted = window.sort((a, b) => a - b);
  const p = (q: number) => sorted[Math.floor(q * sorted.length)] ?? 0;
  console.log(
    `${sorted.length} req/s  p50 ${p(0.5).toFixed(1)} ms` +
      `  p99 ${p(0.99).toFixed(1)} ms  ${JSON.stringify(statuses)}`,
  );
  window = [];
}, 1000);
const ids = Array.from({ length: concurrency }, (_, i) => i);
await Promise.all(ids.map(worker));
clearInterval(timer);
console.log("total", JSON.stringify(statuses));
