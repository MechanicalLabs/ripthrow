import { describe, expect, test } from "bun:test";
import { Err, isOk, Ok } from ".";

describe("isOk", () => {
  test("should return true for Ok result", () => {
    expect(isOk(Ok("success"))).toBe(true);
  });

  test("should return false for Err result", () => {
    expect(isOk(Err("failed"))).toBe(false);
  });
});
