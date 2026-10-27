// Black-box contract tests: they only speak HTTP, so the same file
// checks the legacy service on Node.js or Bun, the new service, and
// the router. Usage: BASE=http://127.0.0.1:3100 bun test contract/
// Expects the database created by `bun run seed` in billing-api.
import { expect, test } from "bun:test";

const BASE = process.env.BASE ?? "http://127.0.0.1:3000";
const get = (path: string) => fetch(BASE + path);

test("health answers ok", async () => {
  const res = await get("/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true });
});

test("revenue for two days matches the seeded data", async () => {
  const res = await get(
    "/reports/revenue?from=2025-03-01&to=2025-03-02",
  );
  expect(res.headers.get("content-type")).toContain("application/json");
  expect(await res.json()).toEqual({
    from: "2025-03-01",
    to: "2025-03-02",
    days: [
      { day: "2025-03-01", cents: 2458130, invoices: 55 },
      { day: "2025-03-02", cents: 2533675, invoices: 55 },
    ],
  });
});

test("a whole year has one row per day", async () => {
  const res = await get(
    "/reports/revenue?from=2025-01-01&to=2025-12-31",
  );
  const { days } = await res.json();
  expect(days).toHaveLength(365);
  const total = days.reduce(
    (n: number, d: { invoices: number }) => n + d.invoices,
    0,
  );
  expect(total).toBe(20000);
});

test("no dates means the whole history", async () => {
  const body = await (await get("/reports/revenue")).json();
  expect(body.from).toBe("0000-01-01");
  expect(body.days).toHaveLength(365);
});

test("reports support conditional requests", async () => {
  const path = "/reports/revenue?from=2025-03-01&to=2025-03-02";
  const first = await get(path);
  const tag = first.headers.get("etag");
  expect(tag).toBeTruthy();
  const again = await fetch(BASE + path, {
    headers: { "if-none-match": tag! },
  });
  expect(again.status).toBe(304);
});
