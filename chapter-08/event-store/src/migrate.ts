import type { Database } from "bun:sqlite";
import { readdir } from "node:fs/promises";

// Applies migrations/NNN_name.sql files in order. SQLite's built-in
// user_version number records the last migration applied.
export async function migrate(db: Database, dir: string) {
  const files = (await readdir(dir))
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();
  const { user_version: current } = db
    .query("PRAGMA user_version")
    .get() as { user_version: number };

  const applied: string[] = [];
  for (const file of files) {
    const version = Number(file.slice(0, 3));
    if (version <= current) continue;
    const sql = await Bun.file(`${dir}/${file}`).text();
    db.transaction(() => {
      db.run(sql);
      db.run(`PRAGMA user_version = ${version}`);
    })();
    applied.push(file);
  }
  return applied;
}
