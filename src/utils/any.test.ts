import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { any } from ".";

describe("any", () => {
  test("should return the first Ok found", () => {
    const results = [Err("fail 1"), Ok(1), Ok(2)];
    const res = any(results);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe(1);
    }
  });

  test("should return the last Err if none are Ok", () => {
    const results = [Err("fail 1"), Err("fail 2")];
    const res = any(results);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe("fail 2");
    }
  });

  test("should return Error for empty input", () => {
    const res = any([]);
    expect(res.ok).toBe(false);
  });
});
