import { Product } from "@acme/shared";
import { z } from "zod";

const PriceUpdate = z.object({
  product: Product,
  newPrice: z.number().positive(),
});

const update = PriceUpdate.parse({
  product: { id: "A100", name: "Coffee beans", price: 12.5 },
  newPrice: 13,
});

console.log(`reprice ${update.product.id} to ${update.newPrice}`);
