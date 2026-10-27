# Chapter 8: Bun's Native SQLite Driver and ORMs

Code for Chapter 8 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4, Drizzle ORM 0.45.4 (drizzle-kit 0.31.11), and Prisma 7.10.1 with the libSQL adapter.

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `basics/` | Getting Started With bun:sqlite; Binding Parameters and Typing Results; Using Transactions and the Synchronous Model; Securing Queries Against Injection | `bun install`, then `bun tour.ts`, `bun types.ts`, `bun transactions.ts`, `bun blocking.ts`, `bun injection.ts`, `bun bun-sql.ts` |
| `event-store/` | Tuning SQLite for Throughput; Building the Persistence Layer | `bun install`, `bun test`, `bun bench/insert.ts`, `bun bench/index.ts`, `bun src/main.ts` |
| `orm-compare/` | Adding Type Safety With an ORM; Comparing Drizzle and Prisma | `bun install`, `bun run db:generate`, `bun test`, `bun bench/compare.ts`, `sh bench/cold.sh` |

`orm-compare` stores its Drizzle migrations in `drizzle/` and its Prisma migration in `prisma/migrations/`; `bun run db:generate` regenerates the Prisma client into `prisma/generated/`.
