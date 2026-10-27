import { Database } from "bun:sqlite";

// A file database, created if missing. ":memory:" makes a private one.
const db = new Database("tour.db", { strict: true });
db.run(`CREATE TABLE IF NOT EXISTS rates (
  pair TEXT PRIMARY KEY, bid REAL NOT NULL, updated TEXT NOT NULL)`);

// run(): for statements that return no rows
const upsert = db.query(
  `INSERT INTO rates (pair, bid, updated) VALUES ($pair, $bid, $updated)
   ON CONFLICT (pair) DO UPDATE SET bid = $bid, updated = $updated`,
);
const now = new Date().toISOString();
const info = upsert.run({ pair: "GBPUSD", bid: 1.2699, updated: now });
console.log("run():", info);
upsert.run({ pair: "EURUSD", bid: 1.0799, updated: now });

// get(): first row or null; all(): every row; values(): arrays
const one = db.query("SELECT * FROM rates WHERE pair = ?");
console.log("get():", one.get("GBPUSD"));
console.log("get() missing:", one.get("XXXYYY"));
console.log("all():", db.query("SELECT pair, bid FROM rates").all());
console.log(
  "values():",
  db.query("SELECT pair, bid FROM rates").values(),
);

// iterate(): one row at a time, for large results
for (const row of db.query("SELECT pair FROM rates").iterate()) {
  console.log("iterate():", row);
}
db.close();
