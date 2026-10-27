import { openStore } from "@igw/store";
import { createSink } from "../../sink/src/sink";
import { loadConfig, type Config } from "../src/config";
import { startGateway } from "../src/gateway";

export async function setup(
  overrides: Partial<Config> = {},
  dbPath = ":memory:",
) {
  const sink = createSink();
  const sinkServer = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    routes: sink.routes,
    fetch: () => new Response("not found", { status: 404 }),
  });
  const store = await openStore(dbPath);
  const config = {
    ...loadConfig(),
    port: 0,
    dbPath,
    sinkUrl: `${sinkServer.url}ingest`,
    logLevel: "error",
    ...overrides,
  } as Config;
  const gateway = startGateway(config, store);
  const key = store.keys.create("test", 10_000, 20_000);
  const base = gateway.server.url.href.replace(/\/$/, "");
  const post = (path: string, body: unknown, headers = {}) =>
    fetch(base + path, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  let stopped = false;
  const close = async () => {
    if (!stopped) await gateway.stop(0);
    stopped = true;
    sinkServer.stop(true);
  };
  const sinkBase = sinkServer.url.href.replace(/\/$/, "");
  return { gateway, store, sink, sinkBase, key, base, post, close };
}

let n = 0;
export const event = (extra = {}) => ({
  id: `e-${++n}`,
  ts: Date.now(),
  type: "page.view",
  user: "u1",
  ...extra,
});
