import { priceOrder, type Coupon, type Line } from "./pricing";
import type { Payments } from "./payments";
import type { Order, Repo } from "./repo";

export type Deps = {
  payments: Payments;
  repo: Repo;
  newId: () => string;
};

export async function placeOrder(
  deps: Deps,
  customerId: string,
  lines: Line[],
  cardToken: string,
  coupon?: Coupon,
): Promise<Order> {
  const { total } = priceOrder(lines, coupon);
  const charge = await deps.payments.charge(total, cardToken);
  if (charge.status !== "succeeded") {
    throw new Error("Card declined");
  }
  const order: Order = {
    id: deps.newId(),
    customerId,
    total,
    chargeId: charge.id,
    createdAt: new Date().toISOString(),
  };
  deps.repo.save(order);
  return order;
}
