// Reproduces an intermittent bug. Run it several times in one go:
//   bun test ./debug/collision-demo.ts --rerun-each 20
import { Database } from "bun:sqlite";
import { mock, test } from "bun:test";
import { placeOrder } from "../src/orders";
import { createRepo } from "../src/repo";

test("two customers order at the same moment", async () => {
  const deps = {
    payments: {
      charge: mock(async () => {
        await Bun.sleep(Math.random() * 2); // real calls vary too
        return { id: "ch_1", status: "succeeded" as const };
      }),
    },
    repo: createRepo(new Database(":memory:")),
    newId: () => `ord_${Date.now()}`, // the bug
  };
  const line = [{ sku: "MUG-01", unitPence: 899, qty: 1 }];
  await Promise.all([
    placeOrder(deps, "alice", line, "tok"),
    placeOrder(deps, "bob", line, "tok"),
  ]);
});
