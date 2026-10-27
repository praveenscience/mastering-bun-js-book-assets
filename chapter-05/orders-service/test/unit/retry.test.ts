import { afterEach, expect, jest, mock, test } from "bun:test";
import { withRetry } from "../../src/retry";

afterEach(() => jest.useRealTimers());

// Lets pending promise callbacks run between timer jumps.
const settle = () => new Promise((r) => setImmediate(r));

test("waits 100 ms, then 200 ms, between attempts", async () => {
  jest.useFakeTimers();
  const flaky = mock()
    .mockRejectedValueOnce(new Error("first"))
    .mockRejectedValueOnce(new Error("second"))
    .mockResolvedValue("ok");

  const result = withRetry(flaky);

  await settle();
  jest.advanceTimersByTime(99);
  await settle();
  expect(flaky).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1);
  await settle();
  expect(flaky).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(200);
  expect(await result).toBe("ok");
  expect(flaky).toHaveBeenCalledTimes(3);
});

test("gives up after the last attempt", async () => {
  const broken = mock().mockRejectedValue(new Error("down"));
  await expect(withRetry(broken, 3, 1)).rejects.toThrow("down");
  expect(broken).toHaveBeenCalledTimes(3);
});
