import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createCursors } from "./cursors";
import { openDatabase } from "./db";
import { createEventStore } from "./events";
import { createKeyStore } from "./keys";
import { migrate } from "./migrate";

export type { EventStore, Row, Stored } from "./events";
export type { ApiKey, KeyStore } from "./keys";

// Opens (or creates) the gateway's database and applies migrations.
export async function openStore(path = ":memory:") {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = openDatabase(path);
  migrate(db);
  return {
    db,
    events: createEventStore(db),
    keys: createKeyStore(db),
    cursors: createCursors(db),
  };
}

export type Store = Awaited<ReturnType<typeof openStore>>;
