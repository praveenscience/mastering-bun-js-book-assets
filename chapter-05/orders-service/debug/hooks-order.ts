// Prints the order in which hooks run:
//   bun test ./debug/hooks-order.ts
import { afterAll, beforeAll, beforeEach, afterEach } from "bun:test";
import { describe, test } from "bun:test";

const log: string[] = [];
beforeAll(() => log.push("beforeAll"));
afterAll(() => console.log(log.join("\n")));

describe("outer", () => {
  beforeEach(() => log.push("  beforeEach (outer)"));
  afterEach(() => log.push("  afterEach (outer)"));
  test("one", () => void log.push("    test one"));

  describe("inner", () => {
    beforeEach(() => log.push("  beforeEach (inner)"));
    test("two", () => void log.push("    test two"));
  });
});
