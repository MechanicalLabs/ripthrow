import { describe, expect, test } from "bun:test";
import { safeAsync } from ".";

describe("safeAsync", () => {
  test("should return Ok when promise resolves", async () => {
    const result = await safeAsync(Promise.resolve("success"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("success");
    }
  });

  test("should return Err when promise rejects", async () => {
    const error = new Error("failed");
    const result = await safeAsync(Promise.reject(error));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });
});
