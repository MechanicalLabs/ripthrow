import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { map } from ".";

describe("map", () => {
  test("should map Ok value", () => {
    const result = Ok(1);
    const mapped = map(result, (val) => val + 1);
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.value).toBe(2);
    }
  });

  test("should not map Err value", () => {
    const result = Err<number, string>("error");
    const mapped = map(result, (val: number) => val + 1);
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) {
      expect(mapped.error).toBe("error");
    }
  });
});
