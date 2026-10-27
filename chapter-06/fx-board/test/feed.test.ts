import { expect, test } from "bun:test";
import { createFeed } from "../src/feed";

test("returns only the missed rates for the requested pairs", () => {
  const feed = createFeed();
  feed.publish("GBPUSD", 1.27); // seq 1
  feed.publish("EURUSD", 1.08); // seq 2
  feed.publish("GBPUSD", 1.28); // seq 3
  const missed = feed.since(1, ["GBPUSD"])!;
  expect(missed.map((r) => r.seq)).toEqual([3]);
});

test("returns null once the missed rates have left the history", () => {
  const feed = createFeed(2);
  for (let i = 0; i < 5; i++) feed.publish("GBPUSD", 1.27);
  expect(feed.since(1, ["GBPUSD"])).toBeNull();
  expect(feed.since(3, ["GBPUSD"])).toHaveLength(2);
});
