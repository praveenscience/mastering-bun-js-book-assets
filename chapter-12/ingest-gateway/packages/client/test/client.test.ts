import { afterEach, expect, test } from "bun:test";
import { IngestClient } from "../src/index";
import { event, setup } from "../../../apps/gateway/test/helpers";

let ctx: Awaited<ReturnType<typeof setup>>;
afterEach(() => ctx?.close());

test("refuses invalid events before sending", () => {
  const client = new IngestClient({ url: "http://unused", key: "k" });
  expect(() => client.add({ ...event(), type: "Bad" })).toThrow(
    "type must",
  );
});

test("retries through backpressure until all is stored", async () => {
  // A tiny queue and a slow flush force many 503 answers.
  ctx = await setup({ maxQueue: 300, flushMs: 50 });
  const clients = Array.from(
    { length: 4 },
    () =>
      new IngestClient({ url: ctx.base, key: ctx.key, batchSize: 250 }),
  );
  for (let i = 0; i < 2000; i++) clients[i % 4]!.add(event());
  await Promise.all(clients.map((c) => c.flush()));
  const retries = clients.reduce((n, c) => n + c.stats.retries, 0);
  expect(retries).toBeGreaterThan(0);
  expect(ctx.store.events.counts().events).toBe(2000);
});
