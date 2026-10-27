import { afterAll, expect, test } from "bun:test";
import { startServer } from "../src/server";
import { freshRepo } from "./helpers";

const { repo } = await freshRepo();
const server = startServer(repo);
afterAll(() => server.stop(true));

const post = (body: unknown) =>
  fetch(new URL("/events", server.url), {
    method: "POST",
    body: JSON.stringify(body),
  });

test("stores a batch and reports stats", async () => {
  const res = await post([
    { ts: 1000, type: "view", userId: "ann", ms: 5 },
    { ts: 2000, type: "purchase", userId: "ann", ms: 80 },
  ]);
  expect(await res.json()).toEqual({ stored: 2 });
  const stats = await fetch(
    new URL("/stats?from=0&to=5000", server.url),
  );
  expect(await stats.json()).toEqual([
    { type: "purchase", n: 1 },
    { type: "view", n: 1 },
  ]);
});

test("rejects the whole batch if one event is invalid", async () => {
  const res = await post([
    { ts: 3000, type: "view", userId: "bob", ms: 5 },
    { ts: 3001, type: "DROP TABLE", userId: "bob", ms: 5 },
  ]);
  expect(res.status).toBe(400);
  expect((await res.json()).error).toStartWith("event 1: type");
  const top = await fetch(new URL("/users/top", server.url));
  expect(await top.json()).toEqual([{ id: "ann", events: 2 }]);
});
