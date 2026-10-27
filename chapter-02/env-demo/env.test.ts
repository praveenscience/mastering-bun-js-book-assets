import { expect, test } from "bun:test";

test("bun test loads .env.test and skips .env.local", () => {
  expect(Bun.env.NODE_ENV).toBe("test");
  expect(Bun.env.SHARED).toBe("test");
  expect(Bun.env.SECRET).toBeUndefined();
});
