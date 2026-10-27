import { expect, test } from "bun:test";
import { safePath } from "../src/storage";

test("accepts a plain file name", () => {
  expect(safePath("uploads", "events-2026.ndjson")).toEndWith(
    "/uploads/events-2026.ndjson",
  );
});

test.each([
  "../secret.ndjson",
  "..%2Fsecret.ndjson",
  "sub/dir.ndjson",
  ".env",
  "notes.ndjson.exe",
  "/etc/passwd",
  "a".repeat(70) + ".txt",
])("rejects %p", (name) => {
  expect(safePath("uploads", name)).toBeNull();
});
