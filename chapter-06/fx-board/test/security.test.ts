import { afterAll, expect, test } from "bun:test";
import { openSocket, startTestApp, ticketFor } from "./helpers";

const app = startTestApp({ maxConnectionsPerUser: 2 });
afterAll(() => app.server.stop(true));

test("refuses a ticket without a valid token", async () => {
  const res = await fetch(`${app.base}/tickets`, { method: "POST" });
  expect(res.status).toBe(401);
});

test("refuses an upgrade from a foreign origin", async () => {
  const ticket = await ticketFor(app.base);
  const res = await fetch(`${app.base}/ws?ticket=${ticket}`, {
    headers: { origin: "https://evil.example" },
  });
  expect(res.status).toBe(403);
});

test("caps connections per user", async () => {
  const a = await openSocket(app.base);
  const b = await openSocket(app.base);
  const ticket = await ticketFor(app.base);
  const third = await fetch(`${app.base}/ws?ticket=${ticket}`);
  expect(third.status).toBe(429);
  a.ws.close();
  b.ws.close();
  await Promise.all([a.closed, b.closed]);
});

test("closes a socket that floods the server", async () => {
  const client = await openSocket(app.base);
  for (let i = 0; i < 50; i++) {
    client.send({ type: "subscribe", pairs: ["GBPUSD"] });
  }
  const event = await client.closed;
  expect(event.code).toBe(1008);
  expect(event.reason).toBe("Rate limit exceeded");
});

test("closes a socket that sends an oversized message", async () => {
  const client = await openSocket(app.base);
  client.ws.send("x".repeat(5 * 1024));
  expect((await client.closed).code).toBe(1009);
});
