import { describe, expect, test } from "bun:test";
import { Err, Ok, safe } from "./factories";
import { build, ResultBuilder } from "./result-builder";

describe("ResultBuilder: Chaining", () => {
  test("should chain operations fluently", () => {
    const res = build(Ok(1))
      .map((n) => n + 1)
      .tap((n) => expect(n).toBe(2))
      .andThen((n) => Ok(n.toString()))
      .match({
        ok: (s: string) => s,
        err: () => "failed",
      });

    expect(res).toBe("2");
  });

  test("should handle error chaining", () => {
    const res = build(Err<number, string>("initial"))
      .map((n) => n + 1)
      .mapErr((e) => `Error: ${e}`)
      .unwrapOr(0);

    expect(res).toBe(0);
  });

  test("should work with safe()", () => {
    const res = build(safe(() => JSON.parse('{"a": 1}')))
      .map((obj: { a: number }) => obj.a)
      .unwrap();

    expect(res).toBe(1);
  });
});

describe("ResultBuilder: Static Constructors", () => {
  test("ResultBuilder.ok() should create a chainable Ok", () => {
    const ok = ResultBuilder.ok("success").unwrap();
    expect(ok).toBe("success");
  });

  test("ResultBuilder.err() should create a chainable Err", () => {
    const { isErr } = ResultBuilder.err("fail");
    expect(isErr).toBe(true);
  });

  test("ResultBuilder.safe() should wrap a throwing function", () => {
    const res = ResultBuilder.safe(() => JSON.parse('{"a": 1}'))
      .map((obj: { a: number }) => obj.a)
      .unwrap();

    expect(res).toBe(1);
  });

  test("ResultBuilder.all() should combine multiple Ok results", () => {
    const res = ResultBuilder.all([Ok("a"), Ok("b")]).unwrap();
    expect(res).toEqual(["a", "b"]);
  });

  test("ResultBuilder.all() should short-circuit on first Err", () => {
    const res = ResultBuilder.all([Ok("a"), Err("fail"), Ok("c")]).result;
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe("fail");
    }
  });

  test("ResultBuilder.any() should return first Ok", () => {
    const res = ResultBuilder.any([Err("a"), Ok("found"), Ok("c")]).unwrap();
    expect(res).toBe("found");
  });

  test("ResultBuilder.any() should return last Err if none succeed", () => {
    const res = ResultBuilder.any([Err("a"), Err("b")]).result;
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe("b");
    }
  });
});

describe("ResultBuilder: Context", () => {
  test("should support context method", () => {
    const res = build(Err("fail")).context("wrapped", "help").result;

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.message).toBe("wrapped");
      expect(res.error.help).toBe("help");
    }
  });
});
