// Shows an error blamed on the wrong test. Run it with:
//   bun test ./debug/floating-demo.ts
import { expect, test } from "bun:test";

async function sendEmail() {
  await Bun.sleep(5);
  throw new Error("SMTP connection refused");
}

test("places an order and emails a receipt", () => {
  sendEmail(); // the bug: nobody awaits this promise
});

test("lists recent orders", async () => {
  await Bun.sleep(20);
  expect(1 + 1).toBe(2);
});
