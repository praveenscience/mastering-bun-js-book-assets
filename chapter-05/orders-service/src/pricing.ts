// All amounts are integers in pence, so totals never drift.
export type Line = { sku: string; unitPence: number; qty: number };
export type Coupon = {
  code: string;
  percent: number;
  minPence: number;
};

export type Price = {
  subtotal: number;
  discount: number;
  total: number;
};

export function priceOrder(lines: Line[], coupon?: Coupon): Price {
  if (lines.length === 0) throw new Error("An order needs a line");
  let subtotal = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      throw new RangeError(`Bad quantity for ${line.sku}`);
    }
    subtotal += line.unitPence * line.qty;
  }
  let discount = 0;
  if (coupon && subtotal >= coupon.minPence) {
    discount = Math.round((subtotal * coupon.percent) / 100);
  }
  return { subtotal, discount, total: subtotal - discount };
}
