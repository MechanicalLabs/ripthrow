import { describe, expect, test } from "bun:test";
import { safe } from ".";

describe("safe", () => {
  test("should return Ok when function succeeds", () => {
    const result = safe(() => "success");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("success");
    }
  });

  test("should return Err when function throws", () => {
    const error = new Error("failed");
    const result = safe(() => {
      throw error;
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });
});
