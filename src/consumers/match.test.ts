import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { match } from ".";

describe("match", () => {
  test("should call ok handler on Ok result", () => {
    const result = Ok<string, string>("success");
    const output = match(result, {
      ok: (val: string) => val.toUpperCase(),
      err: (err: string) => `Error: ${err}`,
    });
    expect(output).toBe("SUCCESS");
  });

  test("should call err handler on Err result", () => {
    const result = Err<string, string>("failed");
    const output = match(result, {
      ok: (val: string) => val.toUpperCase(),
      err: (err: string) => `Error: ${err}`,
    });
    expect(output).toBe("Error: failed");
  });
});
