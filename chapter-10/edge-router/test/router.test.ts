import { afterAll, expect, test } from "bun:test";
import type { Config } from "../src/config";
import { createHandler } from "../src/handler";
import { bucket, choose } from "../src/router";

const backend = (name: string, status = 200) =>
  Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: (req) =>
      Response.json({ from: name, path: new URL(req.url).pathname }, {
        status,
      }),
  });
const legacy = backend("legacy");
const next = backend("next");
const broken = backend("broken", 503);
afterAll(() => [legacy, next, broken].forEach((s) => s.stop(true)));

const config = (percent: number, target = next.url.origin): Config => ({
  backends: { legacy: legacy.url.origin, next: target },
  routes: [{ prefix: "/reports/", backend: "next", percent }],
});
const get = (path: string, headers: Record<string, string> = {}) =>
  new Request(`http://router${path}`, { headers });

test("unrouted paths and 0% stay on legacy", () => {
  expect(choose(config(100), get("/invoices/1"))).toBe("legacy");
  expect(choose(config(0), get("/reports/revenue"))).toBe("legacy");
  expect(choose(config(100), get("/reports/revenue"))).toBe("next");
});

test("a header pins a request to one side", () => {
  const pinned = get("/reports/revenue", { "x-backend": "next" });
  expect(choose(config(0), pinned)).toBe("next");
});

test("the split is sticky and close to the percentage", () => {
  const keys = Array.from({ length: 10_000 }, (_, i) => `user-${i}`);
  const share = keys.filter((k) => bucket(k) < 10).length;
  expect(share).toBeGreaterThan(900);
  expect(share).toBeLessThan(1100);
  expect(bucket("user-7")).toBe(bucket("user-7"));
});

test("a failing new backend falls back to legacy", async () => {
  const stats = {};
  const handle = createHandler(
    () => config(100, broken.url.origin),
    stats,
  );
  const res = await handle(get("/reports/revenue"));
  expect(await res.json()).toMatchObject({ from: "legacy" });
  expect(stats).toEqual({ "to:next": 1, fallback: 1 });
});

test("an unreachable new backend falls back too", async () => {
  const stats = {};
  const handle = createHandler(
    () => config(100, "http://127.0.0.1:9"),
    stats,
  );
  const res = await handle(get("/reports/revenue"));
  expect(res.status).toBe(200);
  expect(stats).toMatchObject({ "error:next": 1, fallback: 1 });
});
