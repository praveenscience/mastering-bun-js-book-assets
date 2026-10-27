// Open-model load test for the gateway (Chapter 11's method): sends
// requests at a fixed rate, each with `batch` events, over HTTP or a
// WebSocket, and times each one from the moment it was due.
// Usage: bun load.ts --url http://127.0.0.1:8080 --key igw_...
//   --rate 1000 --batch 10 --seconds 20 [--ws] [--buffered]
//   [--workers 4] [--p99 50] [--max-errors 0.1]
import { parseArgs } from "node:util";

const { values: a } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:8080" },
    key: { type: "string", default: process.env.IGW_KEY },
    rate: { type: "string", default: "1000" },
    batch: { type: "string", default: "1" },
    seconds: { type: "string", default: "10" },
    workers: { type: "string", default: "4" },
    ws: { type: "boolean", default: false },
    buffered: { type: "boolean", default: false },
    p99: { type: "string" },
    "max-errors": { type: "string" },
    worker: { type: "string" },
  },
});
if (!a.key) throw new Error("--key or IGW_KEY is required");

const types = ["page.view", "click", "search", "order.paid"];
const makeEvents = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i}`,
    ts: Date.now(),
    type: types[i % types.length]!,
    user: `u${(i * 7919) % 50_000}`,
    ms: i % 2000,
  }));

if (a.worker === undefined) {
  // Coordinator: start workers, merge results, check targets.
  const n = Number(a.workers);
  const args = process.argv.slice(2);
  const procs = Array.from({ length: n }, (_, i) =>
    Bun.spawn(["bun", import.meta.path, ...args, "--worker", `${i}`], {
      stdout: "pipe",
    }),
  );
  const parts = await Promise.all(
    procs.map(async (p) =>
      JSON.parse(await new Response(p.stdout).text()),
    ),
  );
  const all = parts.flatMap((p) => p.latencies).sort((x, y) => x - y);
  const errors = parts.reduce((s, p) => s + p.errors, 0);
  const q = (f: number) =>
    all[Math.min(all.length - 1, Math.floor(f * all.length))] ?? 0;
  const seconds = Number(a.seconds);
  const report = {
    requests: all.length,
    eventsPerSecond: Math.round(
      (all.length * Number(a.batch)) / seconds,
    ),
    p50: +q(0.5).toFixed(2),
    p99: +q(0.99).toFixed(2),
    max: +q(1).toFixed(2),
    errorPct: +((100 * errors) / Math.max(1, all.length)).toFixed(3),
  };
  console.log(JSON.stringify(report));
  const missed =
    (a.p99 !== undefined && report.p99 > Number(a.p99)) ||
    (a["max-errors"] !== undefined &&
      report.errorPct > Number(a["max-errors"]));
  if (missed) {
    console.error("target missed");
    process.exit(1);
  }
} else {
  // Worker: one share of the rate.
  const rate = Number(a.rate) / Number(a.workers);
  const total = Math.round(rate * Number(a.seconds));
  const batch = Number(a.batch);
  const latencies: number[] = [];
  let errors = 0;
  const run = `${a.worker}-${Date.now()}`;
  const headers: Record<string, string> = {
    authorization: `Bearer ${a.key}`,
  };
  if (a.buffered) headers["x-ack"] = "buffered";

  // Over a WebSocket, each message is answered by an ack or nack
  // carrying the same ref.
  let ws: WebSocket | undefined;
  const waiting = new Map<number, (ok: boolean) => void>();
  if (a.ws) {
    ws = new WebSocket(`${a.url.replace("http", "ws")}/v1/stream`, {
      headers,
    } as any);
    ws.onmessage = (m) => {
      const reply = JSON.parse(String(m.data));
      waiting.get(reply.ref)?.(reply.type === "ack");
      waiting.delete(reply.ref);
    };
    await new Promise((open) => (ws!.onopen = open));
  }

  async function send(due: number, i: number) {
    const from = Math.min(due, performance.now());
    const events = makeEvents(`${run}-${i}`, batch);
    let ok = false;
    try {
      if (ws) {
        ok = await new Promise<boolean>((done) => {
          waiting.set(i, done);
          ws!.send(JSON.stringify({ ref: i, events }));
        });
      } else {
        const res = await fetch(`${a.url}/v1/events`, {
          method: "POST",
          headers,
          body: JSON.stringify(batch === 1 ? events[0] : events),
        });
        await res.arrayBuffer();
        ok = res.ok;
      }
    } catch {}
    if (!ok) errors++;
    latencies.push(performance.now() - from);
  }

  const start = performance.now();
  const sends: Promise<void>[] = [];
  for (let i = 0; i < total; i++) {
    const due = start + (i * 1000) / rate;
    const wait = due - performance.now();
    if (wait > 1) await Bun.sleep(wait);
    sends.push(send(due, i));
  }
  await Promise.all(sends);
  ws?.close();
  console.log(JSON.stringify({ latencies, errors }));
}
