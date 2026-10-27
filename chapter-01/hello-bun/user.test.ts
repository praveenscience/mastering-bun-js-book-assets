import { expect, test } from "bun:test";
import { parseUser } from "./user";

test("accepts a valid user", () => {
  expect(parseUser({ name: "Asha", age: 29 }).name).toBe("Asha");
});

test("rejects a negative age", () => {
  expect(() => parseUser({ name: "Asha", age: -1 })).toThrow();
});
