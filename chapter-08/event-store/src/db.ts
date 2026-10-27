import { Database } from "bun:sqlite";

// Opens a database with the settings this service relies on.
export function openDatabase(path = ":memory:") {
  const db = new Database(path, { strict: true });
  db.run("PRAGMA journal_mode = WAL"); // readers do not block writers
  db.run("PRAGMA synchronous = NORMAL"); // safe with WAL, much faster
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA busy_timeout = 5000"); // wait for locks, do not fail
  return db;
}
