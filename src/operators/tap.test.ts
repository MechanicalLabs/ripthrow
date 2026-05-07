import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { tap } from "./tap";

describe("tap", () => {
  test("should execute callback for Ok", () => {
    let sideEffect = 0;
    const result = Ok(1);
    const returned = tap(result, (val) => {
      sideEffect = val;
    });

    expect(sideEffect).toBe(1);
    expect(returned).toBe(result);
  });

  test("should not execute callback for Err", () => {
    let sideEffect = 0;
    const result = Err("error");
    const returned = tap(result, () => {
      sideEffect = 1;
    });

    expect(sideEffect).toBe(0);
    expect(returned).toBe(result);
  });
});
