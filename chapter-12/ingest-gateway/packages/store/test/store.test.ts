import { expect, test } from "bun:test";
import { openStore } from "../src/index";

const event = (id: string, keyId = 1) => ({
  keyId,
  id,
  ts: Date.now(),
  type: "click",
  user: "u1",
});

test("a retried event is stored once per key", async () => {
  const { events } = await openStore();
  expect(events.insertBatch([event("a"), event("b")])).toBe(2);
  expect(events.insertBatch([event("a"), event("c")])).toBe(1);
  expect(events.insertBatch([event("a", 2)])).toBe(1); // other key
  expect(events.counts()).toEqual({ events: 4, last: 4 });
});

test("reads in arrival order after a cursor", async () => {
  const { events } = await openStore();
  events.insertBatch(["a", "b", "c"].map((id) => event(id)));
  const rows = events.readAfter(1, 10);
  expect(rows.map((r) => r.event_id)).toEqual(["b", "c"]);
});

test("retention keeps events not yet forwarded", async () => {
  const { events } = await openStore();
  events.insertBatch(["a", "b", "c"].map((id) => event(id)));
  const future = Date.now() + 1000;
  expect(events.expireBefore(future, 2)).toBe(2); // seq 1 and 2
  expect(events.counts().events).toBe(1);
});

test("API keys are stored as hashes and can be revoked", async () => {
  const { db, keys } = await openStore();
  const token = keys.create("mobile-app", 100, 200);
  expect(token).toMatch(/^igw_[0-9a-f]{8}_[\w-]{32}$/);
  expect(keys.verify(token)).toMatchObject({
    name: "mobile-app",
    per_second: 100,
  });
  expect(keys.verify(token + "x")).toBeNull();
  const stored = db.query("SELECT * FROM api_keys").get() as object;
  expect(JSON.stringify(stored)).not.toContain(token.slice(13));
  expect(keys.revoke("mobile-app")).toBe(true);
  expect(keys.verify(token)).toBeNull();
});
