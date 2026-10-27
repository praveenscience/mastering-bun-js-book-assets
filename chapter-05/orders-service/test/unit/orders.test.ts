import { expect, mock, test } from "bun:test";
import { placeOrder, type Deps } from "../../src/orders";

const lines = [{ sku: "MUG-01", unitPence: 899, qty: 2 }];

function fakeDeps(status: "succeeded" | "declined" = "succeeded") {
  return {
    payments: {
      charge: mock(async () => ({ id: "ch_1", status })),
    },
    repo: { save: mock(() => {}), find: mock(() => null) },
    newId: () => "ord_1",
  } satisfies Deps;
}

test("saves nothing when the card is declined", async () => {
  const deps = fakeDeps("declined");
  const attempt = placeOrder(deps, "alice", lines, "tok");

  await expect(attempt).rejects.toThrow("Card declined");
  expect(deps.repo.save).not.toHaveBeenCalled();
});

test("charges the priced total, then saves", async () => {
  const deps = fakeDeps();
  const order = await placeOrder(deps, "alice", lines, "tok");

  expect(deps.payments.charge).toHaveBeenCalledTimes(1);
  expect(deps.payments.charge).toHaveBeenCalledWith(1798, "tok");
  expect(deps.repo.save).toHaveBeenCalledWith(order);
  expect(order).toMatchObject({ id: "ord_1", total: 1798 });
});
