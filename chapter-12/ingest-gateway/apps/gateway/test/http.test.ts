import { afterEach, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { openStore } from "@igw/store";
import { event, setup } from "./helpers";

let ctx: Awaited<ReturnType<typeof setup>>;
afterEach(() => ctx?.close());

describe("POST /v1/events", () => {
  test("needs a valid API key", async () => {
    ctx = await setup();
    const res = await fetch(`${ctx.base}/v1/events`, {
      method: "POST",
      body: JSON.stringify(event()),
    });
    expect(res.status).toBe(401);
  });

  test("stores an event once, even when it is retried", async () => {
    ctx = await setup();
    const e = event();
    expect((await ctx.post("/v1/events", e)).status).toBe(200);
    expect((await ctx.post("/v1/events", e)).status).toBe(200);
    expect(ctx.store.events.counts().events).toBe(1);
  });

  test("accepts the valid part of a batch", async () => {
    ctx = await setup();
    const res = await ctx.post("/v1/events", [
      event(),
      event({ type: "Bad Type" }),
      event(),
    ]);
    expect(await res.json()).toEqual({
      accepted: 2,
      rejected: [
        { index: 1, error: "type must match [a-z][a-z0-9_.]{0,31}" },
      ],
    });
    const none = await ctx.post("/v1/events", [{ nope: 1 }]);
    expect(none.status).toBe(400);
  });

  test("answers 202 at once when the producer asks", async () => {
    ctx = await setup({ flushMs: 1000 });
    const res = await ctx.post("/v1/events", event(), {
      "x-ack": "buffered",
    });
    expect(res.status).toBe(202);
    expect(ctx.store.events.counts().events).toBe(0); // not yet
  });

  test("limits the rate per key", async () => {
    ctx = await setup();
    const slow = ctx.store.keys.create("slow", 10, 20);
    const send = (n: number) =>
      fetch(`${ctx.base}/v1/events`, {
        method: "POST",
        headers: { authorization: `Bearer ${slow}` },
        body: JSON.stringify(Array.from({ length: n }, () => event())),
      });
    expect((await send(15)).status).toBe(200);
    const res = await send(15);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("1");
  });

  test("refuses large bodies, even without a length", async () => {
    ctx = await setup({ maxBodyBytes: 4096 });
    const big = JSON.stringify(event({ props: { x: "y" } })).padEnd(
      5000,
      " ",
    );
    expect((await ctx.post("/v1/events", big)).status).toBe(413);
    const stream = new Response(big).body!; // sent chunked
    const res = await fetch(`${ctx.base}/v1/events`, {
      method: "POST",
      headers: { authorization: `Bearer ${ctx.key}` },
      body: stream,
    });
    expect(res.status).toBe(413);
  });

  test("pushes back when the queue is full", async () => {
    ctx = await setup({ maxQueue: 10, flushMs: 1000 });
    const ten = Array.from({ length: 10 }, () => event());
    const first = ctx.post("/v1/events", ten, { "x-ack": "buffered" });
    expect((await first).status).toBe(202);
    const res = await ctx.post("/v1/events", event());
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("1");
  });
});

describe("POST /v1/events/ndjson", () => {
  test("streams events and reports bad lines by number", async () => {
    ctx = await setup();
    const lines = Array.from({ length: 1500 }, () =>
      JSON.stringify(event()),
    );
    lines[700] = "{not json";
    const res = await ctx.post("/v1/events/ndjson", lines.join("\n"));
    expect(await res.json()).toEqual({
      lines: 1500,
      accepted: 1499,
      rejected: [{ line: 701, error: "event must be an object" }],
    });
    expect(ctx.store.events.counts().events).toBe(1499);
  });
});

test("shutdown stores events that were only buffered", async () => {
  const path = `${tmpdir()}/igw-${process.pid}-${Date.now()}.db`;
  ctx = await setup({ flushMs: 60_000 }, path);
  const res = await ctx.post("/v1/events", [event(), event()], {
    "x-ack": "buffered",
  });
  expect(res.status).toBe(202);
  expect(ctx.store.events.counts().events).toBe(0);
  await ctx.close(); // graceful stop flushes the batcher
  const reopened = await openStore(path);
  expect(reopened.events.counts().events).toBe(2);
  reopened.db.close();
});

test("GET /v1/stats counts recent events per type", async () => {
  ctx = await setup();
  await ctx.post("/v1/events", [
    event({ type: "click" }),
    event({ type: "click" }),
    event({ type: "search" }),
  ]);
  const res = await fetch(`${ctx.base}/v1/stats?minutes=5`, {
    headers: { authorization: `Bearer ${ctx.key}` },
  });
  expect((await res.json()).types).toEqual([
    { type: "click", events: 2 },
    { type: "search", events: 1 },
  ]);
});
