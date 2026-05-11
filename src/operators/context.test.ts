import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { context } from ".";

describe("context", () => {
  test("should add context to error", () => {
    const result = Err("original error");
    const wrapped = context(result, "new context", "help info");

    expect(wrapped.ok).toBe(false);
    if (!wrapped.ok) {
      expect(wrapped.error.message).toBe("new context");
      expect(wrapped.error.help).toBe("help info");
      expect(wrapped.error.cause).toBe("original error");
    }
  });

  test("should not modify Ok result", () => {
    const result = Ok("success");
    const wrapped = context(result, "context");
    expect(wrapped.ok).toBe(true);
  });
});
