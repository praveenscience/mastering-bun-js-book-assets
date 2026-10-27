import { afterAll, expect, test } from "bun:test";
import { startTestApp } from "./helpers";

const app = startTestApp();
afterAll(() => app.server.stop(true));

const mugs = { lines: [{ sku: "MUG-01", qty: 1 }], cardToken: "tok" };
const line = (sku: string, qty: number) => ({
  lines: [{ sku, qty }],
  cardToken: "tok",
});

test("rejects a request without a token", async () => {
  const res = await app.call("/orders", undefined, mugs);
  expect(res.status).toBe(401);
});

test("hides one customer's order from another", async () => {
  const res = await app.call("/orders", "token-alice", mugs);
  const { id } = await res.json();
  const peek = await app.call(`/orders/${id}`, "token-bob");
  expect(peek.status).toBe(404);
});

test.each([
  ["no lines", { lines: [], cardToken: "tok" }, "1 to 50"],
  ["negative qty", line("MUG-01", -3), "above zero"],
  ["script in sku", line("<script>", 1), "letters, digits"],
  ["unknown sku", line("NOPE-9", 1), "Unknown sku"],
  ["not JSON", "{oops", "Not an object"],
  [
    "long token",
    { ...line("MUG-01", 1), cardToken: "x".repeat(65) },
    "short string",
  ],
])("rejects %s with 400", async (_name, body, message) => {
  const res = await app.call("/orders", "token-alice", body);
  expect(res.status).toBe(400);
  expect((await res.json()).error).toContain(message);
});

test("ignores a price sent by the client", async () => {
  const cheap = {
    lines: [{ sku: "MUG-01", qty: 1, unitPence: 1 }],
    cardToken: "tok",
  };
  const res = await app.call("/orders", "token-alice", cheap);
  expect((await res.json()).total).toBe(899);
  expect(app.payments.charge).toHaveBeenLastCalledWith(899, "tok");
});

test("refuses an oversized body", async () => {
  const huge = { lines: [], cardToken: "x".repeat(20_000) };
  const res = await app.call("/orders", "token-alice", huge);
  expect(res.status).toBe(413);
});
