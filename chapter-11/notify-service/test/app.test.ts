import { afterAll, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { bearerChecker } from "../src/auth";
import { loadConfig } from "../src/config";
import { RecentIds } from "../src/dedupe";
import { createLogger } from "../src/log";

const config = loadConfig({ API_TOKEN: "t", PORT: "0" });
const app = createApp({
  config,
  log: createLogger("error"),
  auth: bearerChecker(config.apiToken),
  dedupe: new RecentIds(60_000, 100),
});
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  routes: app.routes,
  websocket: app.websocket,
  fetch: () => new Response("not found", { status: 404 }),
});
app.attach(server);
afterAll(() => server.stop(true));

const post = (body: unknown, token = "t") =>
  fetch(`${server.url}events`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

test("publishes events to subscribers once", async () => {
  const ws = new WebSocket(`${server.url}ws?channel=orders`);
  const got: string[] = [];
  ws.onmessage = (e) => got.push(JSON.parse(e.data).id);
  await new Promise((open) => (ws.onopen = open));
  const event = { id: "e1", channel: "orders", message: "paid" };
  expect((await post(event)).status).toBe(202);
  expect(await (await post(event)).json()).toEqual({
    id: "e1",
    duplicate: true,
  });
  await Bun.sleep(50);
  expect(got).toEqual(["e1"]);
  ws.close();
});

test("rejects bad tokens and bad events", async () => {
  const ok = { id: "x", channel: "orders", message: "m" };
  expect((await post(ok, "wrong")).status).toBe(401);
  expect((await post({ ...ok, channel: "../etc" })).status).toBe(400);
  expect(
    (await post({ ...ok, message: "m".repeat(5000) })).status,
  ).toBe(400);
});

test("readiness follows the state", async () => {
  expect((await fetch(`${server.url}readyz`)).status).toBe(200);
  app.state.ready = false;
  expect((await fetch(`${server.url}readyz`)).status).toBe(503);
  app.state.ready = true;
});

test("exposes Prometheus metrics", async () => {
  const text = await (await fetch(`${server.url}metrics`)).text();
  expect(text).toContain('notify_events_total{result="published"}');
  expect(text).toContain("process_resident_memory_bytes");
  expect(text).toMatch(
    /http_request_duration_seconds_bucket\{.*le="\+Inf"\}/,
  );
});
