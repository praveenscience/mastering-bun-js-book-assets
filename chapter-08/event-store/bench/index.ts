// Times the dashboard query with no index and with two different
// indexes, and prints SQLite's query plan. Usage: bun bench/index.ts
import { Database } from "bun:sqlite";

const db = new Database(":memory:");
db.run(`CREATE TABLE events (id INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL, type TEXT NOT NULL, user_id TEXT NOT NULL,
  ms INTEGER NOT NULL)`);
const types = ["view", "click", "search", "purchase"];
const insert = db.prepare("INSERT INTO events VALUES (?, ?, ?, ?, ?)");
db.transaction(() => {
  for (let i = 1; i <= 1_000_000; i++) {
    insert.run(i, i * 1000, types[i % 4]!, `u${i % 5000}`, i % 2000);
  }
})();

// One hour out of the roughly eleven days of data
const QUERY = `SELECT type, COUNT(*) AS n FROM events
  WHERE ts >= ?1 AND ts < ?2 GROUP BY type`;
const from = 500_000_000;
const to = from + 3_600_000;

for (const index of ["", "(type, ts)", "(ts, type)"]) {
  db.run("DROP INDEX IF EXISTS idx");
  if (index) db.run(`CREATE INDEX idx ON events ${index}`);
  // prepare() and finalize(), not query(): a cached statement would
  // keep the schema locked and stop DROP INDEX in the next round.
  const query = db.prepare(QUERY);
  const start = performance.now();
  for (let i = 0; i < 100; i++) query.all(from, to);
  const ms = ((performance.now() - start) / 100).toFixed(2);
  query.finalize();
  console.log(`${index || "no index"}: ${ms} ms per query`);
  const explain = db.prepare(`EXPLAIN QUERY PLAN ${QUERY}`);
  for (const step of explain.all(from, to) as { detail: string }[]) {
    console.log("   ", step.detail);
  }
  explain.finalize();
}
