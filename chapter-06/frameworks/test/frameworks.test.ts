import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { websocket } from "hono/bun";
import { app as honoApp } from "../hono-app";
import { app as elysiaApp } from "../elysia-app";

spyOn(console, "log").mockImplementation(() => {}); // quiet loggers

const hono = Bun.serve({ port: 0, fetch: honoApp.fetch, websocket });
elysiaApp.listen(0);
afterAll(() => {
  hono.stop(true);
  elysiaApp.stop();
});

const apps = [
  ["Hono", hono.url.href],
  ["Elysia", elysiaApp.server!.url.href],
] as const;

const post = (base: string, body: unknown, token = "demo-token") =>
  fetch(new URL("/alerts", base), {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

describe.each(apps)("%s", (_name, base) => {
  test("returns a rate", async () => {
    const res = await fetch(new URL("/rates/GBPUSD", base));
    expect(await res.json()).toEqual({
      pair: "GBPUSD",
      bid: 1.2699,
      ask: 1.2702,
    });
  });

  test("returns 404 for an unknown pair", async () => {
    const res = await fetch(new URL("/rates/XXXYYY", base));
    expect(res.status).toBe(404);
  });

  test("creates an alert", async () => {
    const res = await post(base, { pair: "EURUSD", above: 1.1 });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ pair: "EURUSD" });
  });

  test("rejects an invalid alert", async () => {
    const res = await post(base, { pair: "EURUSD", above: -1 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test("rejects a missing token", async () => {
    const res = await post(base, { pair: "EURUSD", above: 1 }, "x");
    expect(res.status).toBe(401);
  });

  test("echoes over a WebSocket", async () => {
    const ws = new WebSocket(
      new URL("/echo", base.replace("http", "ws")),
    );
    await new Promise((r) => (ws.onopen = r));
    ws.send("hi");
    const reply = await new Promise((r) => (ws.onmessage = r));
    expect((reply as MessageEvent).data).toBe("echo: hi");
    ws.close();
  });
});
