import { z } from "zod";

const User = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

export type User = z.infer<typeof User>;

export function parseUser(input: unknown): User {
  return User.parse(input);
}
