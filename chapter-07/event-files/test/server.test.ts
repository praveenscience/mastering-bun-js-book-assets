import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startServer } from "../src/server";

let dir: string;
let server: Awaited<ReturnType<typeof startServer>>;
const url = (path: string) => new URL(path, server.url);

const events = [
  { type: "view", ms: 12 },
  { type: "purchase", ms: 340 },
  { type: "view", ms: 7 },
]
  .map((e) => JSON.stringify(e))
  .join("\n");

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "event-files-"));
  server = await startServer({ dir, maxUploadBytes: 1024 });
  await fetch(url("/files/day1.ndjson"), {
    method: "PUT",
    body: events,
  });
});
afterAll(async () => {
  server.stop(true);
  await rm(dir, { recursive: true });
});

test("stores an upload and reports its hash", async () => {
  const res = await fetch(url("/files/day2.ndjson"), {
    method: "PUT",
    body: events,
  });
  expect(res.status).toBe(201);
  const hash = new Bun.CryptoHasher("sha256")
    .update(events)
    .digest("hex");
  expect(await res.json()).toEqual({
    bytes: events.length,
    sha256: hash,
  });
});

test("serves part of a file for a Range request", async () => {
  const res = await fetch(url("/files/day1.ndjson"), {
    headers: { range: "bytes=0-5" },
  });
  expect(res.status).toBe(206);
  expect(res.headers.get("content-range")).toBe(
    `bytes 0-5/${events.length}`,
  );
  expect(await res.text()).toBe('{"type');
});

test("summarizes a stored file", async () => {
  const res = await fetch(url("/files/day1.ndjson/summary"));
  expect(await res.json()).toMatchObject({
    events: 3,
    byType: { view: 2, purchase: 1 },
  });
});

test("streams only the events of one type", async () => {
  const res = await fetch(url("/files/day1.ndjson/only/purchase"));
  expect(await res.text()).toBe('{"type":"purchase","ms":340}\n');
});

test("compresses a download on the fly", async () => {
  const res = await fetch(url("/files/day1.ndjson/gzip"));
  const bytes = new Uint8Array(await res.arrayBuffer());
  expect(new TextDecoder().decode(Bun.gunzipSync(bytes))).toBe(events);
});

test("refuses a body that announces it is too large", async () => {
  const res = await fetch(url("/files/big.ndjson"), {
    method: "PUT",
    body: "x".repeat(2048),
  });
  expect(res.status).toBe(413);
});

test("stops a streamed body at the limit", async () => {
  // A stream has no Content-Length, so only our own count can stop it.
  const body = new ReadableStream({
    start(controller) {
      for (let i = 0; i < 8; i++) controller.enqueue("x".repeat(256));
      controller.close();
    },
  });
  const res = await fetch(url("/files/sneaky.ndjson"), {
    method: "PUT",
    body,
  });
  expect(res.status).toBe(413);
  expect((await readdir(dir)).sort()).toEqual([
    "day1.ndjson",
    "day2.ndjson",
  ]);
});

test.each(["..%2F..%2Fetc%2Fpasswd", "%2e%2e%2fsecret.ndjson", ".env"])(
  "rejects the name %p",
  async (name) => {
    const res = await fetch(url(`/files/${name}`), {
      method: "PUT",
      body: "{}",
    });
    expect(res.status).toBe(400);
  },
);
