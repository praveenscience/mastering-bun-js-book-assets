import { Product } from "@acme/shared";
import rows from "../data/products.csv";

export const catalog: Product[] = rows.map((row) =>
  Product.parse({
    id: row.sku,
    name: row.name,
    price: Number(row.price),
  }),
);
