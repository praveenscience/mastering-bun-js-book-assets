import { placeOrder, type Deps } from "./orders";
import { customerFor } from "./auth";
import { parseOrder } from "./validate";

export type AppDeps = Deps & {
  tokens: Map<string, string>;
  catalog: Map<string, number>; // sku -> unit price in pence
};

const json = (data: unknown, status = 200) =>
  Response.json(data, { status });

export function startServer(deps: AppDeps, port = 0) {
  return Bun.serve({
    port,
    maxRequestBodySize: 16 * 1024,
    routes: {
      "/health": new Response("ok"),
      "/orders": {
        POST: async (req) => {
          const customer = customerFor(
            req.headers.get("authorization"),
            deps.tokens,
          );
          if (!customer) return json({ error: "Unauthorized" }, 401);
          const parsed = parseOrder(await req.json().catch(() => null));
          if (typeof parsed === "string") {
            return json({ error: parsed }, 400);
          }
          const lines = [];
          for (const { sku, qty } of parsed.lines) {
            const unitPence = deps.catalog.get(sku);
            if (unitPence === undefined) {
              return json({ error: `Unknown sku ${sku}` }, 400);
            }
            lines.push({ sku, qty, unitPence });
          }
          const order = await placeOrder(
            deps,
            customer,
            lines,
            parsed.cardToken,
          );
          return json(order, 201);
        },
      },
      "/orders/:id": {
        GET: (req) => {
          const customer = customerFor(
            req.headers.get("authorization"),
            deps.tokens,
          );
          if (!customer) return json({ error: "Unauthorized" }, 401);
          const order = deps.repo.find(req.params.id);
          // Someone else's order looks exactly like a missing one.
          if (!order || order.customerId !== customer) {
            return json({ error: "Not found" }, 404);
          }
          return json(order);
        },
      },
    },
    error(err) {
      console.error(err);
      return json({ error: "Internal error" }, 500);
    },
  });
}
