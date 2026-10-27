import { expect, mock, test } from "bun:test";

mock.module("./clock", () => ({ today: () => "2000-01-01" }));

test("a: uses the mocked clock", async () => {
  const { today } = await import("./clock");
  expect(today()).toBe("2000-01-01");
});
