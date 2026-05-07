import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { tapErr } from "./tap-err";

describe("tapErr", () => {
  test("should execute callback for Err", () => {
    let sideEffect = "";
    const result = Err("failed");
    const returned = tapErr(result, (err) => {
      sideEffect = err;
    });

    expect(sideEffect).toBe("failed");
    expect(returned).toBe(result);
  });

  test("should not execute callback for Ok", () => {
    let sideEffect = "";
    const result = Ok("success");
    const returned = tapErr(result, () => {
      sideEffect = "changed";
    });

    expect(sideEffect).toBe("");
    expect(returned).toBe(result);
  });
});
