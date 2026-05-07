import { describe, expect, test } from "bun:test";
import { Err, Ok, safe } from "./factories";
import { build, ResultBuilder } from "./result-builder";

describe("ResultBuilder", () => {
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

  test("static methods should work correctly", () => {
    const ok = ResultBuilder.ok("success").unwrap();
    expect(ok).toBe("success");

    const err = ResultBuilder.err("fail").isErr;
    expect(err).toBe(true);

    const safeRes = ResultBuilder.safe(() => "safe")
      .map((s) => s.toUpperCase())
      .unwrap();
    expect(safeRes).toBe("SAFE");
  });

  test("static collection methods should work", () => {
    const all = ResultBuilder.all([Ok("a"), Ok("b")]).unwrap();
    expect(all).toEqual(["a", "b"]);

    const any = ResultBuilder.any([Err("a"), Ok("found")]).unwrap();
    expect(any).toBe("found");
  });
});
