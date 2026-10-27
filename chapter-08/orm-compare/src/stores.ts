import { drizzleStore } from "./drizzle";
import { prismaStore } from "./prisma";
import { rawStore } from "./raw";
import type { Store } from "./types";

export const makers: Record<
  string,
  (path: string) => Store | Promise<Store>
> = {
  raw: rawStore,
  drizzle: drizzleStore,
  prisma: prismaStore,
};
