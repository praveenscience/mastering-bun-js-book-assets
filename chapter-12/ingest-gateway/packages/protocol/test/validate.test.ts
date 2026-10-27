import { describe, expect, test } from "bun:test";
import { validate } from "../src/index";

const now = Date.UTC(2026, 9, 27);
const good = { id: "e-1", ts: now, type: "page.view", user: "u42" };
const error = (input: unknown) => {
  const v = validate(input, now);
  return v.ok ? null : v.error;
};

describe("validate", () => {
  test("accepts a minimal and a full event", () => {
    expect(validate(good, now)).toEqual({ ok: true, event: good });
    const full = { ...good, ms: 120, props: { plan: "pro" } };
    expect(validate(full, now)).toEqual({ ok: true, event: full });
  });

  test("rejects unknown fields and bad shapes", () => {
    expect(error([good])).toBe("event must be an object");
    expect(error({ ...good, admin: true })).toBe("unknown field admin");
    expect(error({ ...good, id: "a b" })).toStartWith("id must be");
    expect(error({ ...good, type: "Page View" })).toStartWith(
      "type must",
    );
    expect(error({ ...good, user: "" })).toStartWith("user must");
    expect(error({ ...good, ms: -1 })).toStartWith("ms must");
  });

  test("rejects timestamps far from now", () => {
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    expect(error({ ...good, ts: now - twoDays })).toStartWith(
      "ts must",
    );
    expect(error({ ...good, ts: String(now) })).toStartWith("ts must");
  });

  test("limits props by size, depth, and dangerous keys", () => {
    const big = { blob: "x".repeat(3000) };
    expect(error({ ...good, props: big })).toStartWith(
      "props must be at",
    );
    const deep = { a: { b: { c: { d: 1 } } } };
    expect(error({ ...good, props: deep })).toBe(
      "props are nested too deeply",
    );
    // JSON.parse creates a real own "__proto__" key.
    const sneaky = JSON.parse('{"__proto__": {"isAdmin": true}}');
    expect(error({ ...good, props: sneaky })).toBe(
      "props may not contain __proto__",
    );
  });
});
