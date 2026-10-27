import type { Database } from "bun:sqlite";

export function createCursors(db: Database) {
  const get = db.prepare("SELECT seq FROM cursors WHERE name = ?");
  const set = db.prepare(
    `INSERT INTO cursors (name, seq) VALUES ($name, $seq)
     ON CONFLICT (name) DO UPDATE SET seq = excluded.seq`,
  );
  return {
    get: (name: string) =>
      (get.get(name) as { seq: number } | null)?.seq ?? 0,
    set: (name: string, seq: number) => set.run({ name, seq }),
  };
}
