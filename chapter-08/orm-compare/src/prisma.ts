import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../prisma/generated/client";
import type { Store } from "./types";

export async function prismaStore(path: string): Promise<Store> {
  const adapter = new PrismaLibSql({ url: `file:${path}` });
  const prisma = new PrismaClient({ adapter });
  // Apply the schema the same way "prisma migrate deploy" would.
  const migration = await Bun.file(
    `${import.meta.dir}/../prisma/migrations/0_init/migration.sql`,
  ).text();
  for (const statement of migration
    .split(";")
    .filter((s) => s.trim())) {
    await prisma.$executeRawUnsafe(statement);
  }

  return {
    name: "Prisma",
    insertBatch: async (rows) => {
      await prisma.event.createMany({ data: rows });
    },
    countByType: async () => {
      const groups = await prisma.event.groupBy({
        by: ["type"],
        _count: { _all: true },
        orderBy: { type: "asc" },
      });
      return groups.map((g) => ({ type: g.type, n: g._count._all }));
    },
    findById: (id) =>
      prisma.event.findUnique({
        where: { id },
        select: { id: true, type: true },
      }),
    close: () => prisma.$disconnect(),
  };
}
