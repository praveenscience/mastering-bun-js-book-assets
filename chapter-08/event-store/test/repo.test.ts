import { expect, test } from "bun:test";
import { EventRow } from "../src/repo";
import { freshRepo } from "./helpers";

const t0 = Date.UTC(2026, 9, 27, 9);
const batch = [
  { ts: t0, type: "view", userId: "ann", ms: 12 },
  { ts: t0 + 1000, type: "click", userId: "ann", ms: 40 },
  { ts: t0 + 2000, type: "view", userId: "bob", ms: 7 },
];

test("stores a batch and counts it by type", async () => {
  const { repo } = await freshRepo();
  expect(repo.insertMany(batch)).toBe(3);
  expect(repo.countByType(t0, t0 + 60_000)).toEqual([
    { type: "view", n: 2 },
    { type: "click", n: 1 },
  ]);
  expect(repo.topUsers(1)).toEqual([{ id: "ann", events: 2 }]);
});

test("returns rows as EventRow objects", async () => {
  const { repo } = await freshRepo();
  repo.insertMany([{ ...batch[0]!, payload: { page: "/" } }]);
  const row = repo.find(1)!;
  expect(row).toBeInstanceOf(EventRow);
  expect(row.at.toISOString()).toBe("2026-10-27T09:00:00.000Z");
  expect(JSON.parse(row.payload!)).toEqual({ page: "/" });
});

test("a bad row rolls back the whole batch", async () => {
  const { db, repo } = await freshRepo();
  const bad = { ts: t0, type: "view", userId: "eve", ms: -1 };
  expect(() => repo.insertMany([batch[0]!, bad])).toThrow(
    "CHECK constraint failed",
  );
  expect(db.query("SELECT COUNT(*) AS n FROM events").get()).toEqual({
    n: 0,
  });
});

test("STRICT tables reject values of the wrong type", async () => {
  const { db } = await freshRepo();
  const insert = () =>
    db.run(
      "INSERT INTO events (ts, type, user_id, ms) VALUES (?, ?, ?, ?)",
      ["yesterday", "view", "ann", 1],
    );
  expect(insert).toThrow("cannot store TEXT value in INTEGER column");
});

test("reports the 95th percentile duration per type", async () => {
  const { repo } = await freshRepo();
  const slow = Array.from({ length: 100 }, (_, i) => ({
    ts: t0 + i,
    type: "search",
    userId: "ann",
    ms: i + 1, // 1 to 100 ms
  }));
  repo.insertMany(slow);
  expect(repo.latency(t0, t0 + 1000)).toEqual([
    { type: "search", n: 100, p95: 95 },
  ]);
});
