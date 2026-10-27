import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";

describe("loadConfig", () => {
  test("applies defaults", () => {
    const config = loadConfig({});
    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe("info");
  });

  test("turns PORT from text into a number", () => {
    expect(loadConfig({ PORT: "8080" }).PORT).toBe(8080);
  });

  test("rejects an impossible port", () => {
    expect(() => loadConfig({ PORT: "99999" })).toThrow("PORT");
  });
});
