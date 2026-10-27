// Calls both apps through their typed clients. Start the apps first:
//   bun hono-app.ts & bun elysia-app.ts & bun typed-clients.ts
import { hc } from "hono/client";
import { treaty } from "@elysiajs/eden";
import type { HonoApp } from "./hono-app";
import type { ElysiaApp } from "./elysia-app";

const hono = hc<HonoApp>("http://localhost:3001");
const res = await hono.rates[":pair"].$get({
  param: { pair: "GBPUSD" },
});
console.log("Hono:", await res.json());

const elysia = treaty<ElysiaApp>("localhost:3002");
const { data, error } = await elysia.rates({ pair: "GBPUSD" }).get();
console.log("Elysia:", data ?? error);
