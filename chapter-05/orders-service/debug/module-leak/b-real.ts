import { expect, test } from "bun:test";
import { today } from "./clock";

test("b: expects the real clock", () => {
  expect(today()).not.toBe("2000-01-01");
});
