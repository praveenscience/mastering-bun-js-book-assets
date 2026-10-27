import { expect, test } from "bun:test";
import { newOrderId } from "../../src/ids";

// Regression test for the duplicate-ID bug in debug/collision-demo.ts
test("order IDs made in the same instant are unique", () => {
  const ids = new Set(Array.from({ length: 10_000 }, newOrderId));
  expect(ids.size).toBe(10_000);
});
