// The first slice of billing-api rebuilt for Bun: the read-only
// revenue report, on Hono and bun:sqlite, over the same database.
import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { etag } from "hono/etag";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function createApp(db: Database) {
  const revenue = db.query(
    `SELECT issued_on AS day, SUM(total_cents) AS cents,
       COUNT(*) AS invoices FROM invoices
     WHERE issued_on BETWEEN ? AND ? GROUP BY day ORDER BY day`,
  );
  const app = new Hono();
  // Express sent ETags, and clients revalidate with them.
  app.use("/reports/*", etag({ weak: true }));

  app.get("/health", (c) => c.json({ ok: true, pid: process.pid }));

  app.get("/reports/revenue", (c) => {
    const from = c.req.query("from") ?? "0000-01-01";
    const to = c.req.query("to") ?? "9999-12-31";
    if (!DAY.test(from) || !DAY.test(to)) {
      return c.json({ error: "dates must be YYYY-MM-DD" }, 400);
    }
    return c.json({ from, to, days: revenue.all(from, to) });
  });

  return app;
}
