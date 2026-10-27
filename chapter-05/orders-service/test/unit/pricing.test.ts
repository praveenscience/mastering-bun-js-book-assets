import { describe, expect, test } from "bun:test";
import { priceOrder } from "../../src/pricing";

const mug = { sku: "MUG-01", unitPence: 899, qty: 2 };
const tee = { sku: "TEE-02", unitPence: 1999, qty: 1 };
const tenOff = { code: "TEN", percent: 10, minPence: 2000 };

describe("priceOrder", () => {
  test("adds up the lines", () => {
    expect(priceOrder([mug, tee])).toEqual({
      subtotal: 3797,
      discount: 0,
      total: 3797,
    });
  });

  test("applies a coupon above the minimum spend", () => {
    const price = priceOrder([mug, tee], tenOff);
    expect(price.discount).toBe(380);
    expect(price.total).toBe(3417);
  });

  test.each([0, -1, 1.5])("rejects a quantity of %p", (qty) => {
    expect(() => priceOrder([{ ...mug, qty }])).toThrow(RangeError);
  });

  test("rejects an empty order", () => {
    expect(() => priceOrder([])).toThrow("needs a line");
  });
});

test("a coupon applies at exactly the minimum spend", () => {
  const line = { sku: "GIFT", unitPence: 2000, qty: 1 };
  expect(priceOrder([line], tenOff).discount).toBe(200);
});
