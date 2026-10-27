import { afterAll, expect, test } from "bun:test";
import { openSocket, startTestApp, ticketFor } from "./helpers";

const app = startTestApp();
afterAll(() => app.server.stop(true));

test("streams rates for subscribed pairs only", async () => {
  const client = await openSocket(app.base);
  await client.next((m) => m.type === "welcome");
  client.send({ type: "subscribe", pairs: ["GBPUSD"] });
  await Bun.sleep(20); // let the subscription arrive
  app.feed.publish("EURUSD", 1.08);
  app.feed.publish("GBPUSD", 1.27);

  const rate = await client.next((m) => m.type === "rate");
  expect(rate).toMatchObject({ pair: "GBPUSD", bid: 1.26987 });
  client.ws.close();
});

test("a reconnecting client catches up from lastSeq", async () => {
  const first = await openSocket(app.base);
  first.send({ type: "subscribe", pairs: ["USDJPY"] });
  await Bun.sleep(20);
  const seen = app.feed.publish("USDJPY", 151.0);
  await first.next((m) => m.type === "rate");
  first.ws.close();

  // Published while the client is away
  app.feed.publish("USDJPY", 151.2);
  app.feed.publish("USDJPY", 151.4);

  const again = await openSocket(app.base);
  again.send({
    type: "resume",
    pairs: ["USDJPY"],
    lastSeq: seen.seq,
    epoch: app.feed.epoch,
  });
  const a = await again.next((m) => m.type === "rate");
  const b = await again.next((m) => m.type === "rate");
  expect([a.seq, b.seq]).toEqual([seen.seq + 1, seen.seq + 2]);
  again.ws.close();
});

test("a client that was away too long gets a snapshot", async () => {
  for (let i = 0; i < 60; i++) app.feed.publish("EURGBP", 0.85);
  const client = await openSocket(app.base);
  const { epoch } = app.feed;
  client.send({ type: "resume", pairs: ["EURGBP"], lastSeq: 1, epoch });
  const snap = await client.next((m) => m.type === "snapshot");
  expect(snap.rates).toHaveLength(1);
  client.ws.close();
});

test("a client from an earlier run gets a snapshot", async () => {
  app.feed.publish("GBPUSD", 1.27);
  const client = await openSocket(app.base);
  client.send({
    type: "resume",
    pairs: ["GBPUSD"],
    lastSeq: 45,
    epoch: "old-run",
  });
  const snap = await client.next((m) => m.type === "snapshot");
  expect(snap.rates[0].pair).toBe("GBPUSD");
  client.ws.close();
});

test("answers a bad message with an error, not a crash", async () => {
  const client = await openSocket(app.base);
  client.ws.send("hello?");
  const err = await client.next((m) => m.type === "error");
  expect(err.message).toBe("Not JSON");
  client.ws.close();
});

test("a ticket works only once", async () => {
  const ticket = await ticketFor(app.base);
  const client = await openSocket(app.base, ticket);
  const replay = await fetch(`${app.base}/ws?ticket=${ticket}`);
  expect(replay.status).toBe(401);
  client.ws.close();
});
