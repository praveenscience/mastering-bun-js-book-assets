import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makers } from "../src/stores";

const dir = mkdtempSync(join(tmpdir(), "orm-compare-"));
afterAll(() => rmSync(dir, { recursive: true }));

const events = [
  { ts: 1, type: "view", userId: "ann", ms: 5 },
  { ts: 2, type: "click", userId: "ann", ms: 9 },
  { ts: 3, type: "view", userId: "bob", ms: 2 },
];

describe.each(Object.keys(makers))("%s", (name) => {
  test("gives the same answers as the others", async () => {
    const store = await makers[name]!(join(dir, `${name}.db`));
    await store.insertBatch(events);
    expect(await store.countByType()).toEqual([
      { type: "click", n: 1 },
      { type: "view", n: 2 },
    ]);
    expect(await store.findById(2)).toEqual({ id: 2, type: "click" });
    expect(await store.findById(99)).toBeNull();
    await store.close();
  });
});
