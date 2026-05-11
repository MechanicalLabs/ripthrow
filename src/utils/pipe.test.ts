/** biome-ignore-all lint/style/noMagicNumbers: test values */
import { describe, expect, test } from "bun:test";
import { unwrapOr } from "../consumers";
import { Err, Ok } from "../factories";
import { context, map } from "../operators";
import { pipe } from "./pipe";

describe("pipe", () => {
  test("single function transforms value", async () => {
    const result = await pipe(Ok(42), (r) => map(r, (n: number) => n + 1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(43);
    }
  });

  test("chaining multiple transforms", async () => {
    const result = await pipe(
      Ok(1),
      (r) => map(r, (n: number) => n * 2),
      (r) => map(r, (n: number) => n.toString()),
      (r) => unwrapOr(r, "0"),
    );
    expect(result).toBe("2");
  });

  test("works with Err through chain", async () => {
    const result = await pipe(
      Err<string, string>("fail"),
      (r) => map(r, (s: string) => s.toUpperCase()),
      (r) => unwrapOr(r, "default"),
    );
    expect(result).toBe("default");
  });

  test("works with context operator", async () => {
    const result = await pipe(Err<string, string>("bad input"), (r) =>
      context(r, "Validation failed", "Check your input"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Validation failed");
      expect(result.error.help).toBe("Check your input");
    }
  });

  test("accepts Promise value", async () => {
    const result = await pipe(
      Promise.resolve(Ok(5)),
      (r) => map(r, (n: number) => n * 3),
      (r) => unwrapOr(r, 0),
    );
    expect(result).toBe(15);
  });

  test("no extra functions returns value as-is", async () => {
    const result = await pipe(Ok("hello"));
    expect(result).toEqual(Ok("hello"));
  });
});
