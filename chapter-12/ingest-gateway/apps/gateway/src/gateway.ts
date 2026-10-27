// Wires the gateway together. main.ts and the tests both use this.
import type { Server } from "bun";
import type { Store, Stored } from "@igw/store";
import { createRoutes } from "./app";
import { Batcher } from "./batcher";
import type { Config } from "./config";
import { Forwarder } from "./forwarder";
import { RateLimiter } from "./limits";
import { createLogger } from "./log";
import { Metrics } from "./metrics";
import { createSockets } from "./ws";

export function startGateway(config: Config, store: Store) {
  const log = createLogger(config.logLevel, { service: "gateway" });
  const metrics = new Metrics();
  let server: Server<any> | undefined;

  // Writes a batch, then shows it to live subscribers.
  const write = (events: Stored[]) => {
    const added = store.events.insertBatch(events);
    for (const e of events) {
      for (const topic of [`type:${e.type}`, "type:*"]) {
        if (server && server.subscriberCount(topic) > 0) {
          server.publish(topic, JSON.stringify(e));
        }
      }
    }
    return added;
  };
  const batcher = new Batcher({
    write,
    maxBatch: config.maxBatch,
    maxQueue: config.maxQueue,
    flushMs: config.flushMs,
    onFlush: (n, added, ms) => {
      metrics.inc("igw_flushes_total");
      metrics.inc("igw_stored_total", {}, added);
      metrics.inc("igw_duplicates_total", {}, n - added);
      metrics.observe(
        "igw_flush_seconds",
        { stage: "write" },
        ms / 1000,
      );
    },
  });
  const deps = {
    config,
    store,
    batcher,
    limiter: new RateLimiter(),
    log,
    metrics,
  };
  const http = createRoutes(deps);
  const ws = createSockets(deps);

  server = Bun.serve({
    hostname: config.host,
    port: config.port,
    maxRequestBodySize: 1 << 30, // per-route limits are enforced
    routes: {
      ...http.routes,
      "/v1/stream": (req, srv) => ws.upgrade(req, srv),
      "/v1/tail": (req, srv) => ws.upgrade(req, srv),
    },
    websocket: ws.websocket,
    fetch: () => Response.json({ error: "not found" }, { status: 404 }),
  });

  // Forwarding runs on a Worker when it can (see forward-worker.ts);
  // an in-memory database cannot be shared, so tests use the thread.
  const useWorker =
    config.forwardWorker && config.dbPath !== ":memory:";
  let forwarder: Forwarder | undefined;
  let worker: Worker | undefined;
  let workerLag = 0;
  if (config.sinkUrl && useWorker) {
    // Source runs load the .ts file; a bundle ships forward-worker.js.
    const file = import.meta.url.endsWith(".ts")
      ? "./forward-worker.ts"
      : "./forward-worker.js";
    worker = new Worker(new URL(file, import.meta.url));
    worker.onmessage = ({ data }) => {
      if (data.type === "sent")
        metrics.inc("igw_forwarded_total", {}, data.n);
      if (data.type === "error")
        metrics.inc("igw_forward_errors_total");
      if (data.type === "lag") workerLag = data.lag;
    };
    worker.postMessage({
      dbPath: config.dbPath,
      url: config.sinkUrl,
      batch: config.forwardBatch,
    });
  } else if (config.sinkUrl) {
    forwarder = new Forwarder({
      store,
      url: config.sinkUrl,
      batch: config.forwardBatch,
      log,
      onSent: (n) => metrics.inc("igw_forwarded_total", {}, n),
      onError: () => metrics.inc("igw_forward_errors_total"),
    });
    forwarder.start();
  }
  const forwardedUpTo = () =>
    forwarder?.cursor ??
    (worker ? store.cursors.get("sink") : Infinity);

  metrics.gauges.igw_queued_events = () => batcher.queued;
  metrics.gauges.igw_forward_lag_events = () =>
    forwarder?.lag ?? workerLag;
  metrics.gauges.igw_websockets = () => ws.sockets.size;

  // Retention: hourly, delete old events that were already forwarded.
  const day = 24 * 60 * 60 * 1000;
  const retention = setInterval(
    () => {
      const before = Date.now() - config.retentionDays * day;
      const forwarded = Math.min(
        forwardedUpTo(),
        Number.MAX_SAFE_INTEGER,
      );
      let removed = 0;
      for (let n = 1; n > 0; removed += n) {
        n = store.events.expireBefore(before, forwarded);
      }
      if (removed) log.info("retention", { removed });
    },
    60 * 60 * 1000,
  );

  // Graceful shutdown (Chapter 11), plus: nothing accepted may be
  // left in memory, so flush the batcher before closing.
  async function stop(drainSeconds = config.drainSeconds) {
    http.state.ready = false;
    await Bun.sleep(drainSeconds * 1000);
    for (const s of ws.sockets) s.close(1012, "service restart");
    await server!.stop();
    batcher.flush();
    clearInterval(retention);
    await forwarder?.stop();
    if (worker) {
      const stopped = new Promise((done) =>
        worker!.addEventListener("message", (m) => {
          if (m.data.type === "stopped") done(null);
        }),
      );
      worker.postMessage("stop");
      await stopped;
      worker.terminate();
    }
    store.db.close();
    log.info("stopped", { queued: batcher.queued });
  }

  log.info("listening", { port: server.port });
  return {
    server,
    stop,
    batcher,
    forwarder,
    metrics,
    state: http.state,
  };
}
