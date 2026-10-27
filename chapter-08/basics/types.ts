import { Database } from "bun:sqlite";

const db = new Database(":memory:", { strict: true });
db.run("CREATE TABLE t (flag INTEGER, at TEXT, data BLOB, note TEXT)");
const insert = db.query(
  "INSERT INTO t VALUES ($flag, $at, $data, $note)",
);

try {
  insert.run({
    flag: true,
    at: new Date() as any,
    data: null,
    note: null,
  });
} catch (err) {
  console.log("Date:", (err as Error).message);
}
insert.run({
  flag: true,
  at: new Date("2026-10-27T09:00:00Z").toISOString(),
  data: new Uint8Array([0xca, 0xfe]),
  note: null,
});
console.log(db.query("SELECT * FROM t").get());

// 2^53 + 1 cannot be represented as a JavaScript number
const big = db.query("SELECT 9007199254740993 AS n");
console.log("default:", big.get());
console.log("safeIntegers:", big.safeIntegers(true).get());
