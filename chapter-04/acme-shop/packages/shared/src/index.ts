import { z } from "zod";

export const Product = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive(),
});

export type Product = z.infer<typeof Product>;
