import { describe, expect, test } from "bun:test";
import { Err, Ok } from "./index";
import { isErr } from "./is-err";

describe("isErr", () => {
  test("should return true for Err result", () => {
    expect(isErr(Err("failed"))).toBe(true);
  });

  test("should return false for Ok result", () => {
    expect(isErr(Ok("success"))).toBe(false);
  });
});
