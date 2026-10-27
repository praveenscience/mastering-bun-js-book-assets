import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { createApp } from "../src/app";

const db = new Database(":memory:");
db.run(`CREATE TABLE invoices (id INTEGER PRIMARY KEY,
  customer_id INTEGER, issued_on TEXT, total_cents INTEGER,
  lines TEXT)`);
for (const [day, cents] of [["2025-03-01", 100], ["2025-03-01", 200],
  ["2025-03-02", 50]] as const) {
  db.run(
    "INSERT INTO invoices (customer_id, issued_on, total_cents, lines)" +
      " VALUES (1, ?, ?, '[]')",
    [day, cents],
  );
}
const app = createApp(db);

test("sums revenue per day", async () => {
  const res = await app.request("/reports/revenue?from=2025-03-01");
  expect(await res.json()).toEqual({
    from: "2025-03-01",
    to: "9999-12-31",
    days: [
      { day: "2025-03-01", cents: 300, invoices: 2 },
      { day: "2025-03-02", cents: 50, invoices: 1 },
    ],
  });
});

test("rejects malformed dates", async () => {
  const res = await app.request("/reports/revenue?from=yesterday");
  expect(res.status).toBe(400);
});
