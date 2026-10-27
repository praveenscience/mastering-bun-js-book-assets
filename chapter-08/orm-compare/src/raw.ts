import { Database } from "bun:sqlite";
import type { NewEvent, Store } from "./types";

export function rawStore(path: string): Store {
  const db = new Database(path, { strict: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, type TEXT NOT NULL,
    user_id TEXT NOT NULL, ms INTEGER NOT NULL)`);
  const insert = db.prepare(
    `INSERT INTO events (ts, type, user_id, ms)
     VALUES ($ts, $type, $userId, $ms)`,
  );
  const insertAll = db.transaction((events: NewEvent[]) => {
    for (const e of events) insert.run(e);
  });
  const count = db.prepare(
    `SELECT type, COUNT(*) AS n FROM events
     GROUP BY type ORDER BY type`,
  );
  const find = db.prepare("SELECT id, type FROM events WHERE id = ?");

  return {
    name: "bun:sqlite",
    insertBatch: async (events) => insertAll(events),
    countByType: async () =>
      count.all() as { type: string; n: number }[],
    findById: async (id) =>
      find.get(id) as { id: number; type: string } | null,
    close: async () => db.close(),
  };
}
