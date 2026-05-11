import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { mapErr } from ".";

describe("mapErr", () => {
  test("should map Err value", () => {
    const result = Err("error");
    const mapped = mapErr(result, (err) => `Wrapped: ${err}`);
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) {
      expect(mapped.error).toBe("Wrapped: error");
    }
  });

  test("should not map Ok value", () => {
    const result = Ok("success");
    const mapped = mapErr(result, (err) => `Wrapped: ${err}`);
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.value).toBe("success");
    }
  });
});
