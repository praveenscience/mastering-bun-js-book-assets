import { expect, test } from "bun:test";
import { openSocket, startTestApp } from "./helpers";

test("SSE delivers rates as events", async () => {
  const app = startTestApp();
  const res = await fetch(`${app.base}/events?pairs=GBPUSD`);
  expect(res.headers.get("content-type")).toBe("text/event-stream");
  const reader = res
    .body!.pipeThrough(new TextDecoderStream())
    .getReader();
  expect((await reader.read()).value).toBe(": connected\n\n");

  app.feed.publish("GBPUSD", 1.27);
  expect((await reader.read()).value).toStartWith("id: 1\ndata: {");
  await reader.cancel();
  await app.server.stop(true);
});

test("shutdown fails readiness, then closes sockets", async () => {
  const app = startTestApp();
  const client = await openSocket(app.base);
  expect((await fetch(`${app.base}/readyz`)).status).toBe(200);

  const stopping = app.shutdown(100);
  expect((await fetch(`${app.base}/readyz`)).status).toBe(503);
  expect((await client.closed).code).toBe(1001);
  await stopping;
});
