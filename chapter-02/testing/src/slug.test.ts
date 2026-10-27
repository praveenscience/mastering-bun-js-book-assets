import { describe, expect, test } from "bun:test";
import { slugify } from "./slug";

describe("slugify", () => {
  test("lowercases and joins words", () => {
    expect(slugify("Hello Bun World")).toBe("hello-bun-world");
  });

  test("drops punctuation at the edges", () => {
    expect(slugify("  Ready, set, go!  ")).toBe("ready-set-go");
  });
});
