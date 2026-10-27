// Runs a version of notify-service under steady load, prints its
// memory every 10 seconds, and takes a heap snapshot at the first
// and last checkpoints. Usage: bun loadtest/leak.ts <leaky|fixed>
//   [seconds=60] [rate=5000]
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [variant = "leaky", seconds = "60", rate = "5000"] =
  Bun.argv.slice(2);
const port = 3402;
const dir = join(import.meta.dir, `snapshots-${variant}`);
mkdirSync(dir, { recursive: true });
const service = join(import.meta.dir, "../notify-service");
const entry =
  variant === "fixed"
    ? ["src/main.ts"]
    : ["scripts/variants.ts", variant];

const env = {
  ...process.env,
  PORT: String(port),
  API_TOKEN: "leak",
  LOG_LEVEL: "warn",
  HEAP_SNAPSHOT_DIR: dir,
};
const server = Bun.spawn(["bun", ...entry], { cwd: service, env });
await Bun.sleep(700);
const load = Bun.spawn(
  [
    "bun",
    join(import.meta.dir, "load.ts"),
    "--url",
    `http://127.0.0.1:${port}/events`,
    "--post",
    "--rate",
    rate,
    "--seconds",
    seconds,
  ],
  { env, stdout: "ignore" },
);

async function sample(t: number) {
  const text = await (
    await fetch(`http://127.0.0.1:${port}/metrics`)
  ).text();
  const get = (name: string) =>
    Number(text.match(new RegExp(`^${name} (\\S+)$`, "m"))?.[1]);
  const mb = (n: number) => `${(n / 2 ** 20).toFixed(0)} MB`;
  console.log(
    `${String(t).padStart(3)} s  rss ${mb(
      get("process_resident_memory_bytes"),
    )}  heap ${mb(get("bun_heap_size_bytes"))}  objects ${get(
      "bun_heap_object_count",
    )}  ids ${get("notify_dedupe_ids")}`,
  );
}

for (let t = 10; t <= Number(seconds); t += 10) {
  await Bun.sleep(10_000);
  await sample(t);
  if (t === 10 || t === Number(seconds)) {
    server.kill("SIGUSR2");
    await Bun.sleep(1500);
  }
}
await load.exited;
server.kill();
console.log("snapshots:", readdirSync(dir).sort().join(", "));
