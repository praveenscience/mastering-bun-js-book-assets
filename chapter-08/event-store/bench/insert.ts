// Inserts events into a file database five different ways and
// reports rows per second. Usage: bun bench/insert.ts
import { Database } from "bun:sqlite";
import { rmSync } from "node:fs";

const SCHEMA = `CREATE TABLE events (id INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL, type TEXT NOT NULL, user_id TEXT NOT NULL,
  ms INTEGER NOT NULL)`;
const INSERT = "INSERT INTO events (ts, type, user_id, ms) VALUES ";
const row = (i: number) => [i, "view", `u${i % 5000}`, i % 2000];

function removeFiles() {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`bench.db${suffix}`, { force: true });
  }
}

function fresh(wal: boolean) {
  removeFiles();
  const db = new Database("bench.db");
  if (wal) {
    db.run("PRAGMA journal_mode = WAL");
    db.run("PRAGMA synchronous = NORMAL");
  }
  db.run(SCHEMA);
  return db;
}

function measure(name: string, rows: number, work: () => void) {
  const start = performance.now();
  work();
  const seconds = (performance.now() - start) / 1000;
  const perSecond = Math.round(rows / seconds).toLocaleString("en-GB");
  console.log(`${name.padEnd(42)} ${perSecond.padStart(10)} rows/s`);
}

for (const wal of [false, true]) {
  const mode = wal ? "WAL, synchronous=NORMAL" : "default journal";
  let db = fresh(wal);
  let stmt = db.prepare(INSERT + "(?, ?, ?, ?)");
  measure(`one commit per row, ${mode}`, 2_000, () => {
    for (let i = 0; i < 2_000; i++) stmt.run(...row(i));
  });

  db = fresh(wal);
  stmt = db.prepare(INSERT + "(?, ?, ?, ?)");
  measure(`one transaction, ${mode}`, 200_000, () => {
    db.transaction(() => {
      for (let i = 0; i < 200_000; i++) stmt.run(...row(i));
    })();
  });
}

// 100 rows per statement, inside one transaction
const db = fresh(true);
const many = db.prepare(
  INSERT + Array(100).fill("(?, ?, ?, ?)").join(","),
);
measure("100 rows per statement, WAL", 200_000, () => {
  db.transaction(() => {
    for (let i = 0; i < 200_000; i += 100) {
      const values = [];
      for (let j = i; j < i + 100; j++) values.push(...row(j));
      many.run(...values);
    }
  })();
});
db.close();
removeFiles();
