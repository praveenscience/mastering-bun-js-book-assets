import { tmpdir } from "node:os";
import { createApp } from "./app";
import { bearerChecker } from "./auth";
import { loadConfig } from "./config";
import { RecentIds } from "./dedupe";
import { enableHeapSnapshots } from "./diagnostics";
import { createLogger } from "./log";
import { shutdown } from "./shutdown";

const config = loadConfig();
const log = createLogger(config.logLevel, { service: "notify" });
const app = createApp({
  config,
  log,
  auth: bearerChecker(config.apiToken),
  dedupe: new RecentIds(10 * 60_000, config.maxRecentEvents),
});

const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  // Events are small; the 128 MB default invites abuse.
  maxRequestBodySize: 64 * 1024,
  routes: app.routes,
  websocket: app.websocket,
  fetch: () => Response.json({ error: "not found" }, { status: 404 }),
});
app.attach(server);
enableHeapSnapshots(process.env.HEAP_SNAPSHOT_DIR ?? tmpdir(), log);
log.info("listening", { port: server.port, pid: process.pid });

let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    const result = await shutdown(
      {
        server,
        state: app.state,
        sockets: app.sockets,
        log,
        drainSeconds: config.drainSeconds,
        timeoutSeconds: config.shutdownTimeoutSeconds,
      },
      signal,
    );
    process.exit(result === "drained" ? 0 : 1);
  });
}
