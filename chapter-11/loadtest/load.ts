// Open-model load test: sends requests at a fixed rate, whether or
// not earlier ones have answered, and measures each latency from the
// moment the request was due. Spreads the rate over several worker
// processes so the client is not the bottleneck.
// Usage: bun load.ts --url <url> --rate 2000 --seconds 20
//        [--post] [--workers 4] [--p99 50] [--max-errors 0.1]
import { parseArgs } from "node:util";

const { values: a } = parseArgs({
  options: {
    url: { type: "string" },
    rate: { type: "string", default: "1000" },
    seconds: { type: "string", default: "10" },
    workers: { type: "string", default: "4" },
    post: { type: "boolean", default: false },
    p99: { type: "string" },
    "max-errors": { type: "string" },
    worker: { type: "string" },
  },
});
if (!a.url) throw new Error("--url is required");

if (a.worker !== undefined) {
  // Worker: send rate/workers requests per second, report JSON.
  const rate = Number(a.rate) / Number(a.workers);
  const total = Math.round(rate * Number(a.seconds));
  const latencies: number[] = [];
  let errors = 0;
  const start = performance.now();
  const sends: Promise<void>[] = [];
  for (let i = 0; i < total; i++) {
    const due = start + (i * 1000) / rate;
    const wait = due - performance.now();
    if (wait > 1) await Bun.sleep(wait);
    sends.push(send(due, `${a.worker}-${i}`));
  }
  await Promise.all(sends);
  console.log(JSON.stringify({ latencies, errors }));

  async function send(due: number, id: string) {
    // Time from the moment the request was due, so queueing in the
    // client counts; a request sent a little early counts from now.
    const from = Math.min(due, performance.now());
    try {
      const res = await fetch(
        a.url!,
        a.post
          ? {
              method: "POST",
              headers: {
                authorization: `Bearer ${process.env.API_TOKEN}`,
              },
              body: JSON.stringify({
                id,
                channel: "load",
                message: "x",
              }),
            }
          : undefined,
      );
      await res.arrayBuffer();
      if (res.status >= 500) errors++;
    } catch {
      errors++;
    }
    latencies.push(performance.now() - from);
  }
} else {
  // Coordinator: start the workers and merge their results.
  const n = Number(a.workers);
  const procs = Array.from({ length: n }, (_, i) =>
    Bun.spawn(
      [
        "bun",
        import.meta.path,
        ...process.argv.slice(2),
        "--worker",
        String(i),
      ],
      { stdout: "pipe" },
    ),
  );
  const parts = await Promise.all(
    procs.map(async (p) => JSON.parse(await p.stdout.text())),
  );
  const all = parts.flatMap((p) => p.latencies).sort((x, y) => x - y);
  const errors = parts.reduce((s, p) => s + p.errors, 0);
  const q = (f: number) =>
    all[Math.min(all.length - 1, Math.floor(f * all.length))]!;
  const errorPct = (100 * errors) / all.length;
  const report = {
    requests: all.length,
    rate: Math.round(all.length / Number(a.seconds)),
    p50: +q(0.5).toFixed(2),
    p90: +q(0.9).toFixed(2),
    p99: +q(0.99).toFixed(2),
    max: +all.at(-1)!.toFixed(2),
    errorPct: +errorPct.toFixed(3),
  };
  console.log(JSON.stringify(report));
  const slow = a.p99 !== undefined && report.p99 > Number(a.p99);
  const failing =
    a["max-errors"] !== undefined && errorPct > Number(a["max-errors"]);
  if (slow || failing) {
    console.error(
      `SLO missed: p99 ${report.p99} ms, errors ${errorPct}%`,
    );
    process.exit(1);
  }
}
