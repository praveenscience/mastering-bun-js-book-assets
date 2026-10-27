import { Database } from "bun:sqlite";
import { asc, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { events } from "./drizzle-schema";
import type { Store } from "./types";

export function drizzleStore(path: string): Store {
  const sqlite = new Database(path);
  sqlite.run("PRAGMA journal_mode = WAL");
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });

  return {
    name: "Drizzle",
    insertBatch: async (rows) => {
      db.transaction((tx) => {
        // SQLite allows at most 32,766 bound values per statement
        for (let i = 0; i < rows.length; i += 500) {
          tx.insert(events)
            .values(rows.slice(i, i + 500))
            .run();
        }
      });
    },
    countByType: async () =>
      db
        .select({ type: events.type, n: count() })
        .from(events)
        .groupBy(events.type)
        .orderBy(asc(events.type))
        .all(),
    findById: async (id) =>
      db
        .select({ id: events.id, type: events.type })
        .from(events)
        .where(eq(events.id, id))
        .get() ?? null,
    close: async () => sqlite.close(),
  };
}
