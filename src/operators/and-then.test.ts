import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { andThen } from "./and-then";

describe("andThen", () => {
  test("should chain Ok results", () => {
    const result = Ok(1);
    const chained = andThen(result, (val) => Ok(val + 1));
    expect(chained.ok).toBe(true);
    if (chained.ok) {
      expect(chained.value).toBe(2);
    }
  });

  test("should short-circuit on Err", () => {
    const result = Ok(1);
    const chained = andThen(result, () => Err("failed"));
    expect(chained.ok).toBe(false);
    if (!chained.ok) {
      expect(chained.error).toBe("failed");
    }
  });

  test("should skip if initial result is Err", () => {
    const result = Err<number, string>("initial");
    const chained = andThen(result, (val: number) => Ok(val + 1));
    expect(chained.ok).toBe(false);
    if (!chained.ok) {
      expect(chained.error).toBe("initial");
    }
  });
});
