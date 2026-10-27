# Chapter 10: Auditing and Migrating Node.js Codebases Without Downtime

Code for Chapter 10 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4 and Node.js 22.20 on macOS (Apple M3 Max).

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `billing-api-before/` | The Node.js service as it was: Express 4, Jest, cls-hooked | `npm install`, `npm test`, `npm run seed`, `npm start` |
| `audit/` | Auditing a Node.js Codebase | `bun audit/scan.ts billing-api-before` (after `npm install` there) |
| `interop/` | Mixing ES Modules and CommonJS | `./interop/run.sh` (needs `node` and `bun`) |
| `billing-api/` | Moving Tooling and Tests First; the migrated service | `bun install`, `bun test`, `bun run seed`, `bun start` (or `npm run start:node` to roll back) |
| `billing-next/` | Strangling a Service Route by Route: `/reports/` on Hono and bun:sqlite | `bun install`, `bun test`, `bun start` |
| `edge-router/` | The strangler-fig router with shadow traffic and fallback | `bun install`, `bun test`, `bun start` |
| `contract/` | Validating Every Step: black-box HTTP tests | `BASE=http://127.0.0.1:3100 bun test contract/` |
| `loadtest/` | Benchmarks and the rehearsal | `bun loadtest/bench.ts <url>`, `bun loadtest/rehearse.ts` |

The rehearsal expects `bun install` in `billing-api`, `billing-next`, and `edge-router`, and `bun run seed` in `billing-api` first. Services listen on 127.0.0.1 only: legacy 3100, next 3200, router 3000.
