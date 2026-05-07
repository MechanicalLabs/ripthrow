import { describe, expect, test } from "bun:test";
import { Ok } from "./ok";

describe("Ok", () => {
  test("should return a success Result", () => {
    const value = { message: "success" };
    const result = Ok(value);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(value);
    }
  });

  test("should handle various types", () => {
    expect(Ok(null).ok).toBe(true);
    expect(Ok(undefined).ok).toBe(true);

    const zero = 0;
    const resultZero = Ok(zero);
    if (resultZero.ok) {
      expect(resultZero.value).toBe(zero);
    }

    const emptyString = "";
    const resultEmpty = Ok(emptyString);
    if (resultEmpty.ok) {
      expect(resultEmpty.value).toBe(emptyString);
    }

    const arr = ["a", "b", "c"];
    const resultArr = Ok(arr);
    if (resultArr.ok) {
      expect(resultArr.value).toBe(arr);
    }
  });

  test("should handle void (no arguments)", () => {
    const result = Ok();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeUndefined();
    }
  });
});
