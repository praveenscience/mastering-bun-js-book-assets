import { expect, test } from "bun:test";
import { formatPrice, toCents } from "../src/index";

test("converts pounds to whole pence", () => {
  expect(toCents(12.5)).toBe(1250);
  expect(toCents(0.1 + 0.2)).toBe(30);
});

test("formats a product price", () => {
  const mug = { id: "A200", name: "Mug", price: 8 };
  expect(formatPrice(mug)).toBe("Mug: £8.00");
});
