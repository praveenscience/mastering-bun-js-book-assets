// HTTP routes of the gateway. WebSocket handling is in ws.ts.
import type { ApiKey, Store } from "@igw/store";
import { accept } from "./accept";
import type { Batcher } from "./batcher";
import { readLimited, TooLarge } from "./body";
import type { Config } from "./config";
import type { RateLimiter } from "./limits";
import { readLines } from "./lines";
import type { Logger } from "./log";
import type { Metrics } from "./metrics";

export type Deps = {
  config: Config;
  store: Store;
  batcher: Batcher;
  limiter: RateLimiter;
  log: Logger;
  metrics: Metrics;
};

export const MAX_EVENTS_PER_REQUEST = 1000;
const json = (body: unknown, status = 200, headers = {}) =>
  Response.json(body, { status, headers });

export function authenticate(
  store: Store,
  req: Request,
): ApiKey | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  return store.keys.verify(header.slice(7));
}

export function createRoutes(d: Deps) {
  const state = { ready: true };
  const count = (result: string, n = 1) =>
    d.metrics.inc("igw_events_total", { result }, n);

  // POST /v1/events: one event or an array of up to 1,000.
  async function postEvents(req: Request) {
    const key = authenticate(d.store, req);
    if (!key) return json({ error: "invalid API key" }, 401);
    let body: unknown;
    try {
      body = JSON.parse(await readLimited(req, d.config.maxBodyBytes));
    } catch (err) {
      if (err instanceof TooLarge) {
        return json({ error: "body too large" }, 413);
      }
      return json({ error: "body must be JSON" }, 400);
    }
    const items = Array.isArray(body) ? body : [body];
    if (items.length > MAX_EVENTS_PER_REQUEST) {
      return json(
        { error: `at most ${MAX_EVENTS_PER_REQUEST} events` },
        413,
      );
    }
    const wait = d.limiter.take(key, items.length);
    if (wait > 0) {
      count("rate_limited", items.length);
      return json({ error: "rate limit" }, 429, {
        "retry-after": String(Math.ceil(wait / 1000)),
      });
    }
    const { events, rejected } = accept(items, key.id);
    count("rejected", rejected.length);
    if (events.length === 0)
      return json({ accepted: 0, rejected }, 400);

    const committed = d.batcher.add(events);
    if (!committed) {
      count("busy", events.length);
      return json({ error: "busy, retry" }, 503, {
        "retry-after": "1",
      });
    }
    count("accepted", events.length);
    if (req.headers.get("x-ack") === "buffered") {
      return json({ accepted: events.length, rejected }, 202);
    }
    try {
      await committed; // ack only after the batch is on disk
    } catch {
      return json({ error: "storage failed, retry" }, 503);
    }
    return json({ accepted: events.length, rejected }, 200);
  }

  // POST /v1/events/ndjson: a stream of events, one per line.
  // Backpressure here means reading the upload more slowly.
  async function postNdjson(req: Request) {
    const key = authenticate(d.store, req);
    if (!key) return json({ error: "invalid API key" }, 401);
    if (!req.body) return json({ error: "empty body" }, 400);
    const pending: Promise<number>[] = [];
    const rejected: { line: number; error: string }[] = [];
    let lines = 0;
    let accepted = 0;
    let chunk: unknown[] = [];
    let lineNos: number[] = [];

    const push = async () => {
      const wait = d.limiter.take(key, chunk.length);
      if (wait === Infinity) throw new Error("chunk exceeds burst");
      if (wait > 0) await Bun.sleep(wait); // read the upload slower
      const result = accept(chunk, key.id);
      for (const r of result.rejected) {
        if (rejected.length < 100) {
          rejected.push({ line: lineNos[r.index]!, error: r.error });
        }
      }
      let committed = d.batcher.add(result.events);
      while (!committed) {
        await Bun.sleep(5); // queue full: stop reading for a moment
        committed = d.batcher.add(result.events);
      }
      pending.push(committed);
      accepted += result.events.length;
      chunk = [];
      lineNos = [];
    };

    for await (const line of readLines(req.body)) {
      lines++;
      if (!line) continue;
      let item: unknown = null; // bad JSON is reported by accept()
      try {
        item = JSON.parse(line);
      } catch {}
      chunk.push(item);
      lineNos.push(lines);
      if (chunk.length === 500) await push();
    }
    if (chunk.length) await push();
    count("accepted", accepted);
    await Promise.all(pending);
    return json({ lines, accepted, rejected });
  }

  // GET /v1/stats?minutes=15: events per type, for dashboards. The
  // window is capped: a day of events took 0.2 s to count, and that
  // query would run on the thread that accepts events.
  function stats(req: Request) {
    if (!authenticate(d.store, req)) {
      return json({ error: "invalid API key" }, 401);
    }
    const minutes = Number(
      new URL(req.url).searchParams.get("minutes") ?? 15,
    );
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
      return json({ error: "minutes must be 1 to 60" }, 400);
    }
    const to = Date.now();
    const from = to - minutes * 60_000;
    return json({
      from,
      to,
      types: d.store.events.countByType(from, to),
    });
  }

  const routes = {
    "/healthz": () => json({ ok: true }),
    "/readyz": () =>
      state.ready ? json({ ready: true }) : json({ ready: false }, 503),
    "/metrics": () =>
      new Response(d.metrics.render(), {
        headers: { "content-type": "text/plain; version=0.0.4" },
      }),
    "/v1/events": { POST: postEvents },
    "/v1/events/ndjson": { POST: postNdjson },
    "/v1/stats": { GET: stats },
  };
  return { routes, state };
}
