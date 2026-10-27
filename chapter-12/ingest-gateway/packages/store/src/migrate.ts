import type { Database } from "bun:sqlite";
import events from "../migrations/001_events.sql" with { type: "text" };
import keys from "../migrations/002_api_keys.sql" with { type: "text" };
import cursors from "../migrations/003_cursors.sql" with {
  type: "text",
};

// Text imports (Chapter 3) put the SQL inside a bundle or binary, so
// the gateway needs no migrations folder at run time.
export const MIGRATIONS = [events, keys, cursors];

// Applies migrations in order; SQLite's user_version records the last
// one applied (Chapter 8).
export function migrate(db: Database, migrations = MIGRATIONS) {
  const { user_version: current } = db
    .query("PRAGMA user_version")
    .get() as { user_version: number };
  migrations.forEach((sql, i) => {
    const version = i + 1;
    if (version <= current) return;
    db.transaction(() => {
      db.run(sql);
      db.run(`PRAGMA user_version = ${version}`);
    })();
  });
}
