// Rehearses a strangler-fig cutover and a rollback under load:
// starts billing-api (legacy), billing-next and edge-router, sends
// traffic, and moves /reports/ step by step. Run from Chapter-10/
// after `bun install` in each project and `bun run seed` in
// billing-api: bun loadtest/rehearse.ts
import { tmpdir } from "node:os";
import { join } from "node:path";

const here = join(import.meta.dir, "..");
const routes = join(tmpdir(), `routes-${process.pid}.json`);
const db = join(here, "billing-api/data/billing.db");
const source = join(here, "edge-router/routes.json");
const config = await Bun.file(source).json();
await Bun.write(routes, JSON.stringify(config, null, 2));

type Env = Record<string, string>;
const start = (dir: string, file: string, env: Env) =>
  Bun.spawn(["bun", file], {
    cwd: join(here, dir),
    env: { ...process.env, ...env },
    stdout: "ignore",
    stderr: "inherit",
  });
const legacy = start("billing-api", "src/server.js", { PORT: "3100" });
let next = start("billing-next", "src/server.ts", {
  PORT: "3200",
  DB_PATH: db,
});
const router = start("edge-router", "src/server.ts", {
  PORT: "3000",
  ROUTES: routes,
});
await Bun.sleep(1000);

const t0 = Date.now();
const log = (msg: string) =>
  console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${msg}`);
const stats = async () => {
  const res = await fetch("http://127.0.0.1:3000/__router/stats");
  return JSON.stringify(await res.json());
};
async function setPercent(percent: number) {
  config.routes[0].percent = percent;
  await Bun.write(routes, JSON.stringify(config, null, 2));
  log(`/reports/ -> next at ${percent}%  stats ${await stats()}`);
}

const traffic = Bun.spawn(["bun", "loadtest/traffic.ts", "36"], {
  cwd: here,
  stdout: "inherit",
});
log(`shadow only, 0% to next`);
await Bun.sleep(6000);
await setPercent(10);
await Bun.sleep(6000);
await setPercent(50);
await Bun.sleep(6000);
await setPercent(100);
await Bun.sleep(6000);
next.kill("SIGKILL");
log(`billing-next killed  stats ${await stats()}`);
await Bun.sleep(6000);
await setPercent(0);
log("rolled back");
await traffic.exited;
log(`final stats ${await stats()}`);
for (const p of [legacy, router, next]) p.kill();
