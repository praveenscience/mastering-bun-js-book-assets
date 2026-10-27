import { Database } from "bun:sqlite";
import { createApp } from "./app";

const path = process.env.DB_PATH ?? "../billing-api/data/billing.db";
// { readonly: true } fails on a WAL database that no other process
// has open, so we open it normally and forbid writes instead.
const db = new Database(path);
db.run("PRAGMA query_only = ON");
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? 3200),
  fetch: createApp(db).fetch,
});
console.log(`billing-next ${process.pid} on :${server.port}`);
