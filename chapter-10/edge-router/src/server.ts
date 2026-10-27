import { watch } from "node:fs";
import { load, type Config } from "./config";
import { createHandler } from "./handler";
import type { Stats } from "./router";

const path = process.env.ROUTES ?? `${import.meta.dir}/../routes.json`;
let config: Config = await load(path);
const stats: Stats = {};

// Reload on every change; keep the old config if the new one is bad.
watch(path, async () => {
  try {
    config = await load(path);
    console.log("routes reloaded", JSON.stringify(config.routes));
  } catch (err) {
    console.error("routes rejected:", (err as Error).message);
  }
});

const handle = createHandler(() => config, stats);
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: { "/__router/stats": () => Response.json(stats) },
  fetch: handle,
});
console.log(`edge-router on :${server.port}`);
