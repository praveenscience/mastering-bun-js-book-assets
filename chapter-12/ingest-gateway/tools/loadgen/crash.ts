// Kills the gateway with SIGKILL in the middle of a load, then checks
// which acknowledged events actually reached the database.
// Usage: bun crash.ts [stored|buffered]
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "@igw/store";

const mode = Bun.argv[2] === "buffered" ? "buffered" : "stored";
const dbPath = join(tmpdir(), `igw-crash-${process.pid}.db`);
const setup = await openStore(dbPath);
const key = setup.keys.create("crash-test", 1e9, 1e9);
setup.db.close();

const gateway = Bun.spawn(["bun", "src/main.ts"], {
  cwd: join(import.meta.dir, "../../apps/gateway"),
  env: {
    ...process.env,
    DB_PATH: dbPath,
    PORT: "8282",
    LOG_LEVEL: "error",
  },
});
await Bun.sleep(800);

const acked: string[] = [];
let sent = 0;
let running = true;
async function producer(worker: number) {
  for (let i = 0; running; i++) {
    const id = `w${worker}-${i}`;
    sent++;
    try {
      const res = await fetch("http://127.0.0.1:8282/v1/events", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "x-ack": mode },
        body: JSON.stringify({
          id,
          ts: Date.now(),
          type: "crash.test",
          user: "u1",
        }),
      });
      if (res.ok) acked.push(id);
    } catch {
      return; // the gateway is gone
    }
  }
}
const producers = Array.from({ length: 32 }, (_, w) => producer(w));
await Bun.sleep(2000);
gateway.kill("SIGKILL"); // no chance to flush anything
running = false;
await Promise.all(producers);

const after = await openStore(dbPath);
const has = after.db.prepare("SELECT 1 FROM events WHERE event_id = ?");
const lost = acked.filter((id) => !has.get(id));
console.log(
  JSON.stringify({
    mode,
    sent,
    acknowledged: acked.length,
    stored: after.events.counts().events,
    acknowledgedButLost: lost.length,
  }),
);
after.db.close();
for (const f of ["", "-wal", "-shm"])
  rmSync(dbPath + f, { force: true });
