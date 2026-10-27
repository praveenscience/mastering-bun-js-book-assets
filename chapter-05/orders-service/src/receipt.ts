import type { Order } from "./repo";

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function renderReceipt(order: Order, items: string[]) {
  const issued = new Date().toISOString().slice(0, 10);
  return [
    `Receipt ${order.id}`,
    `Issued ${issued}`,
    ...items.map((item) => `  - ${item}`),
    `Total ${gbp.format(order.total / 100)}`,
  ].join("\n");
}
