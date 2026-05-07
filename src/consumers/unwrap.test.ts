import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { unwrap } from "./unwrap";

describe("unwrap", () => {
  test("should return value for Ok", () => {
    expect(unwrap(Ok("success"))).toBe("success");
  });

  test("should throw error for Err", () => {
    expect(() => unwrap(Err("failed"))).toThrow("failed");
  });
});
