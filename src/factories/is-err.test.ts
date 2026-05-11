import { describe, expect, test } from "bun:test";
import { Err, isErr, Ok } from ".";

describe("isErr", () => {
  test("should return true for Err result", () => {
    expect(isErr(Err("failed"))).toBe(true);
  });

  test("should return false for Ok result", () => {
    expect(isErr(Ok("success"))).toBe(false);
  });
});
