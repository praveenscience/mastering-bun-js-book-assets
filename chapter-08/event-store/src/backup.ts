import type { Database } from "bun:sqlite";

// Writes a consistent copy of a live database to a new file.
// VACUUM INTO works while other connections keep reading and writing,
// and the copy is compact and needs no -wal file.
export function backup(db: Database, path: string) {
  db.run("VACUUM INTO ?", [path]);
}
