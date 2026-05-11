import { describe, expect, test } from "bun:test";
import { Err } from ".";

describe("Err", () => {
  test("should return an error Result", () => {
    const error = new Error("something went wrong");
    const result = Err(error);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  test("should handle various error types", () => {
    expect(Err("string error").ok).toBe(false);

    const notFound = 404;
    const resultNotFound = Err(notFound);
    if (!resultNotFound.ok) {
      expect(resultNotFound.error).toBe(notFound);
    }

    const authError = { code: "AUTH_FAILED" };
    const resultAuth = Err(authError);
    if (!resultAuth.ok) {
      expect(resultAuth.error).toEqual(authError);
    }
  });
});
