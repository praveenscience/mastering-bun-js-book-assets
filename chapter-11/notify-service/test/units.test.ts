import { describe, expect, test } from "bun:test";
import { bearerChecker } from "../src/auth";
import { loadConfig, secret } from "../src/config";
import { RecentIds } from "../src/dedupe";

describe("config", () => {
  test("reads secrets from a file named by NAME_FILE", async () => {
    const file = `${import.meta.dir}/.tmp-secret`;
    await Bun.write(file, "from-file\n");
    try {
      expect(secret({ API_TOKEN_FILE: file }, "API_TOKEN")).toBe(
        "from-file",
      );
    } finally {
      await Bun.file(file).delete();
    }
  });

  test("fails fast on bad or missing values", () => {
    expect(() => loadConfig({})).toThrow("missing secret API_TOKEN");
    expect(() => loadConfig({ API_TOKEN: "x", PORT: "http" })).toThrow(
      "PORT must be an integer from 0 to 65535",
    );
  });

  test("is frozen", () => {
    const config = loadConfig({ API_TOKEN: "x" });
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.port).toBe(3000);
  });
});

describe("dedupe", () => {
  test("forgets ids after the ttl", () => {
    let now = 0;
    const ids = new RecentIds(1000, 10, () => now);
    expect(ids.seen("a")).toBe(false);
    expect(ids.seen("a")).toBe(true);
    now = 1001;
    expect(ids.seen("b")).toBe(false);
    expect(ids.size).toBe(1);
  });

  test("never holds more than max ids", () => {
    const ids = new RecentIds(60_000, 100);
    for (let i = 0; i < 10_000; i++) ids.seen(`id-${i}`);
    expect(ids.size).toBe(100);
  });
});

test("bearer check accepts only the exact token", () => {
  const check = bearerChecker("s3cret");
  expect(check("Bearer s3cret")).toBe(true);
  expect(check("Bearer s3cret2")).toBe(false);
  expect(check("s3cret")).toBe(false);
  expect(check(null)).toBe(false);
});
