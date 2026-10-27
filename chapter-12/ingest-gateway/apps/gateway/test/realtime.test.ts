import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { afterEach, expect, test } from "bun:test";
import { event, setup } from "./helpers";

let ctx: Awaited<ReturnType<typeof setup>>;
afterEach(() => ctx?.close());

const open = (url: string, key: string) => {
  const ws = new WebSocket(url, {
    headers: { authorization: `Bearer ${key}` },
  } as any);
  const messages: any[] = [];
  ws.onmessage = (m) => messages.push(JSON.parse(String(m.data)));
  return new Promise<{ ws: WebSocket; messages: any[] }>((resolve) => {
    ws.onopen = () => resolve({ ws, messages });
  });
};

test("producers get acks; tails see stored events", async () => {
  ctx = await setup();
  const wsBase = ctx.base.replace("http", "ws");
  const tail = await open(`${wsBase}/v1/tail?type=order.paid`, ctx.key);
  const producer = await open(`${wsBase}/v1/stream`, ctx.key);
  producer.ws.send(
    JSON.stringify({
      ref: 7,
      events: [event({ type: "order.paid" }), event(), { bad: 1 }],
    }),
  );
  await Bun.sleep(100);
  expect(producer.messages).toEqual([
    {
      type: "ack",
      ref: 7,
      accepted: 2,
      rejected: [{ index: 2, error: "unknown field bad" }],
    },
  ]);
  expect(tail.messages.map((m) => m.type)).toEqual(["order.paid"]);
  producer.ws.close();
  tail.ws.close();
});

test("WebSockets without a key are refused", async () => {
  ctx = await setup();
  const res = await fetch(`${ctx.base}/v1/stream`, {
    headers: { upgrade: "websocket" },
  });
  expect(res.status).toBe(401);
});

test("the forwarder catches up after an outage", async () => {
  ctx = await setup();
  await fetch(`${ctx.sinkBase}/outage?seconds=1`, { method: "POST" });
  const batch = Array.from({ length: 300 }, () => event());
  expect((await ctx.post("/v1/events", batch)).status).toBe(200);
  await Bun.sleep(2500);
  expect(ctx.sink.stats.failed).toBeGreaterThan(0);
  expect(ctx.sink.stats.unique).toBe(300);
  expect(ctx.gateway.forwarder!.lag).toBe(0);
});

test("with a database file, a Worker does the forwarding", async () => {
  const path = `${tmpdir()}/igw-worker-${process.pid}.db`;
  ctx = await setup({}, path);
  const batch = Array.from({ length: 500 }, () => event());
  expect((await ctx.post("/v1/events", batch)).status).toBe(200);
  await Bun.sleep(1500);
  expect(ctx.sink.stats.unique).toBe(500);
  expect(ctx.gateway.forwarder).toBeUndefined(); // not on this thread
  await ctx.close();
  for (const f of ["", "-wal", "-shm"]) {
    rmSync(path + f, { force: true });
  }
});
