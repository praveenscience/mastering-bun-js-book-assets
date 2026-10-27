import { describe, expect, test } from "bun:test";
import { loadConfig } from "../../src/config";

describe("production config after the overlay", async () => {
  const config = (await loadConfig("production")) as any;

  test.each(["https://shop.example.com", "https://admin.example.com"])(
    "still allows %s",
    (origin) => {
      expect(config.cors.allowedOrigins).toContain(origin);
    },
  );

  test("talks to payments over HTTPS", () => {
    expect(config.payments.url).toStartWith("https://");
  });

  test("keeps settings the overlay does not mention", () => {
    expect(config.payments.timeoutMs).toBe(2000);
  });

  test("runs more than one replica", () => {
    expect(config.replicas).toBeGreaterThan(1);
  });
});
