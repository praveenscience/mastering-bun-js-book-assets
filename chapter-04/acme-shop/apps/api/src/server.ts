import { formatPrice } from "@acme/money";
import { catalog } from "./catalog";

const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  routes: {
    "/products": () => Response.json(catalog),
    "/products/labels": () =>
      new Response(catalog.map(formatPrice).join("\n")),
  },
});

console.log(`api listening on ${server.url}`);
