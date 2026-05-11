import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { all } from ".";

describe("all", () => {
  test("should combine all Ok results", () => {
    const results = [Ok("a"), Ok("b"), Ok("c")];
    const combined = all(results);
    expect(combined.ok).toBe(true);
    if (combined.ok) {
      expect(combined.value).toEqual(["a", "b", "c"]);
    }
  });

  test("should return the first Err found", () => {
    const results = [Ok(1), Err("fail 1"), Err("fail 2")];
    const combined = all(results);
    expect(combined.ok).toBe(false);
    if (!combined.ok) {
      expect(combined.error).toBe("fail 1");
    }
  });

  test("should return empty array for empty input", () => {
    const combined = all([]);
    expect(combined.ok).toBe(true);
    if (combined.ok) {
      expect(combined.value).toEqual([]);
    }
  });
});
