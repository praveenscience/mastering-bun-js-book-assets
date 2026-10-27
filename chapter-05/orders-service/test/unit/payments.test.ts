import { afterEach, expect, spyOn, test } from "bun:test";
import { createPayments } from "../../src/payments";

afterEach(() => {
  // Put the real fetch back, whatever the test did.
  (globalThis.fetch as any).mockRestore?.();
});

test("sends the amount and the API key", async () => {
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ id: "ch_9", status: "succeeded" }),
  );
  const payments = createPayments("https://pay.test", "sk_test");

  const charge = await payments.charge(1798, "tok");

  expect(charge.id).toBe("ch_9");
  const [url, init] = fetchSpy.mock.calls[0]!;
  expect(url).toBe("https://pay.test/charges");
  expect(init?.headers).toMatchObject({
    authorization: "Bearer sk_test",
  });
  expect(JSON.parse(init?.body as string)).toEqual({
    amount: 1798,
    cardToken: "tok",
  });
});

test("turns an HTTP error into an exception", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("busy", { status: 503 }),
  );
  const payments = createPayments("https://pay.test", "sk_test");

  await expect(payments.charge(100, "tok")).rejects.toThrow("503");
});
