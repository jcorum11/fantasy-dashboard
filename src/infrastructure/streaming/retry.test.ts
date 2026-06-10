import { describe, expect, it, vi } from "vitest";
import { withRetry } from "@/src/infrastructure/streaming/retry";

// Assumed contract:
//   withRetry(fn, {retries: 3, delayMs: 0}) -> Promise<T>
//   - retries thrown errors and rejections up to `retries` total attempts
//   - does NOT retry errors marked non-retryable (4xx client errors) —
//     callers throw RetryAbortError (exported) to abort early
//   - rethrows the last error after exhausting attempts

import { RetryAbortError } from "@/src/infrastructure/streaming/retry";

describe("withRetry", () => {
  it("returns the first successful result without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, { retries: 3, delayMs: 0 })).resolves.toBe(
      "ok"
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries failures and succeeds on a later attempt", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("flaky"))
      .mockRejectedValueOnce(new Error("flaky again"))
      .mockResolvedValueOnce("ok");

    await expect(withRetry(fn, { retries: 3, delayMs: 0 })).resolves.toBe(
      "ok"
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("rethrows the last error after exhausting attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("hard down"));

    await expect(withRetry(fn, { retries: 3, delayMs: 0 })).rejects.toThrow(
      "hard down"
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry a RetryAbortError (4xx-style failures)", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new RetryAbortError("FantasyPros request failed: 403"));

    await expect(withRetry(fn, { retries: 3, delayMs: 0 })).rejects.toThrow(
      /403/
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
