import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { unwrapOr } from "./unwrap-or";

describe("unwrapOr", () => {
  test("should return value if Ok", () => {
    const result = Ok("success");
    expect(unwrapOr(result, "default")).toBe("success");
  });

  test("should return default value if Err", () => {
    const result = Err("error");
    expect(unwrapOr(result, "default")).toBe("default");
  });
});
