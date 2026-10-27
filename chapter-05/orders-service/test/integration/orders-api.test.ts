import { afterAll, expect, spyOn, test } from "bun:test";
import { startTestApp } from "./helpers";

const app = startTestApp();
afterAll(() => app.server.stop(true));

const mugs = { lines: [{ sku: "MUG-01", qty: 2 }], cardToken: "tok" };

test("creates an order and reads it back", async () => {
  const created = await app.call("/orders", "token-alice", mugs);
  expect(created.status).toBe(201);
  const order = await created.json();
  expect(order).toMatchObject({ customerId: "alice", total: 1798 });

  const read = await app.call(`/orders/${order.id}`, "token-alice");
  expect(read.status).toBe(200);
  expect(await read.json()).toEqual(order);
});

test("hides internal errors behind a 500", async () => {
  app.payments.charge.mockRejectedValueOnce(new Error("ECONNRESET"));
  const quiet = spyOn(console, "error").mockImplementation(() => {});

  const res = await app.call("/orders", "token-alice", mugs);

  expect(res.status).toBe(500);
  expect(await res.text()).not.toContain("ECONNRESET");
  expect(quiet).toHaveBeenCalledTimes(1);
  quiet.mockRestore();
});

test("answers a health check", async () => {
  const res = await app.call("/health");
  expect(await res.text()).toBe("ok");
});
