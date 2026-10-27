import { Database } from "bun:sqlite";
import { startServer } from "./app";
import { createPayments } from "./payments";
import { createRepo } from "./repo";
import { newOrderId } from "./ids";

const payments = createPayments(
  process.env.PAYMENTS_URL ?? "http://localhost:4010",
  process.env.PAYMENTS_KEY ?? "",
);
const server = startServer(
  {
    payments,
    repo: createRepo(new Database("orders.sqlite")),
    newId: newOrderId,
    tokens: new Map([["dev-token-alice", "alice"]]),
    catalog: new Map([
      ["MUG-01", 899],
      ["TEE-02", 1999],
    ]),
  },
  Number(process.env.PORT ?? 3000),
);
console.log(`Orders service on ${server.url}`);
