import { Database } from "bun:sqlite";

const db = new Database(":memory:", { strict: true });
db.run(
  "CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INTEGER)",
);
db.run("INSERT INTO accounts VALUES ('ann', 100), ('bob', 0)");
const move = db.prepare(
  "UPDATE accounts SET balance = balance + $amount WHERE name = $name",
);
const balances = () =>
  JSON.stringify(db.query("SELECT * FROM accounts").all());

// Correct: a synchronous function. Any throw rolls everything back.
const transfer = db.transaction((amount: number) => {
  move.run({ name: "ann", amount: -amount });
  if (amount > 50) throw new Error("Limit exceeded");
  move.run({ name: "bob", amount });
});
try {
  transfer(80);
} catch (err) {
  console.log("sync:", (err as Error).message, balances());
}

// Wrong: an async function. The commit happens at the first await,
// so the error afterwards cannot roll anything back.
const asyncTransfer = db.transaction(async (amount: number) => {
  move.run({ name: "ann", amount: -amount });
  await Bun.sleep(1); // for example, calling a fraud-check API
  throw new Error("Fraud check failed");
});
await asyncTransfer(80).catch((err: Error) =>
  console.log("async:", err.message, balances()),
);
