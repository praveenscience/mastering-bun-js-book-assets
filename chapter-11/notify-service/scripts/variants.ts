// The two versions of the service that shipped with problems, for
// the profiling exercises. Usage: bun scripts/variants.ts <name>,
// where name is slow-auth, slow-auth-async, or leaky (same
// environment variables as main.ts).
import { tmpdir } from "node:os";
import { createApp } from "../src/app";
import { bearerChecker, type AuthCheck } from "../src/auth";
import { loadConfig } from "../src/config";
import { RecentIds, type Dedupe } from "../src/dedupe";
import { enableHeapSnapshots } from "../src/diagnostics";
import { createLogger } from "../src/log";

const variant = Bun.argv[2];
const config = loadConfig();

// v1 stored only a password hash of the token and checked every
// request against it with the synchronous API: correct, and slow by
// design, on the thread that serves every other request too.
async function slowAuth(token: string): Promise<AuthCheck> {
  const hash = await Bun.password.hash(token);
  return (header) =>
    header?.startsWith("Bearer ") === true &&
    Bun.password.verifySync(header.slice(7), hash);
}

// The async API moves the hashing to Bun's thread pool. The CPU
// profile of the JavaScript thread then looks clean, but requests
// still queue once the pool is busy.
async function slowAuthAsync(token: string): Promise<AuthCheck> {
  const hash = await Bun.password.hash(token);
  return async (header) =>
    header?.startsWith("Bearer ") === true &&
    (await Bun.password.verify(header.slice(7), hash));
}

// v1 also remembered every event id forever.
class UnboundedIds implements Dedupe {
  private ids = new Set<string>();
  seen(id: string) {
    if (this.ids.has(id)) return true;
    this.ids.add(id);
    return false;
  }
  get size() {
    return this.ids.size;
  }
}

const app = createApp({
  config,
  log: createLogger(config.logLevel),
  auth:
    variant === "slow-auth"
      ? await slowAuth(config.apiToken)
      : variant === "slow-auth-async"
        ? await slowAuthAsync(config.apiToken)
        : bearerChecker(config.apiToken),
  dedupe:
    variant === "leaky"
      ? new UnboundedIds()
      : new RecentIds(10 * 60_000, config.maxRecentEvents),
});
const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  routes: app.routes,
  websocket: app.websocket,
  fetch: () => new Response("not found", { status: 404 }),
});
app.attach(server);
const log = createLogger("info");
enableHeapSnapshots(process.env.HEAP_SNAPSHOT_DIR ?? tmpdir(), log);
console.log(`variant ${variant} on :${server.port}`);
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
