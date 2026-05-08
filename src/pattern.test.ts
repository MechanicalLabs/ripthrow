import { describe, expect, test } from "bun:test";
import { Err, Ok } from "./factories";
import { createError, createErrors, matchErr, wrapError } from "./pattern";

const NotFound = createError(
  "NotFound",
  (id: string) => `User "${id}" not found`,
  (id: string) => `Check user ID "${id}"`,
);

const DbError = createError("DbError", (code: number) => `Database error ${code}`);

const dbErrorCode = 500;

class TokenExpiredError extends Error {
  readonly expiredAt: Date;

  constructor(expiredAt: Date) {
    super("Token expired");
    this.name = "TokenExpiredError";
    this.expiredAt = expiredAt;
  }
}

const JwtError = wrapError(TokenExpiredError);

describe("createError", () => {
  test("should create an Error with interpolated message", () => {
    const err = NotFound("alice");

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("NotFound");
    expect(err.message).toBe('User "alice" not found');
  });

  test("should attach args and help", () => {
    const err = NotFound("bob");

    expect(err.args).toEqual(["bob"]);
    expect(err.help).toBe('Check user ID "bob"');
  });

  test("should handle multiple args", () => {
    const err = DbError(dbErrorCode);

    expect(err.name).toBe("DbError");
    expect(err.message).toBe("Database error 500");
    expect(err.args).toEqual([dbErrorCode]);
    expect(err.help).toBeUndefined();
  });

  test("should work with Err()", () => {
    const result = Err(NotFound("alice"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe("NotFound");
      expect(result.error.message).toBe('User "alice" not found');
    }
  });
});

describe("wrapError", () => {
  test("should match external error classes", () => {
    const err = new TokenExpiredError(new Date("2025-01-01"));

    expect(err.name).toBe("TokenExpiredError");
    expect(err).toBeInstanceOf(TokenExpiredError);
  });
});

describe("matchErr builder — basic", () => {
  test(".on + .otherwise should call matching handler for Err", () => {
    const result = Err(NotFound("alice"));

    const output = matchErr(result)
      .on(NotFound, (e) => `Missing: ${e.args[0]}`)
      .otherwise((e) => `Other: ${e.message}`);

    expect(output).toBe("Missing: alice");
  });

  test(".otherwise should catch unmatched errors", () => {
    const result = Err(DbError(dbErrorCode));

    const output = matchErr(result)
      .on(NotFound, (e) => `Missing: ${e.args[0]}`)
      .otherwise((e) => `Other: ${e.message}`);

    expect(output).toBe("Other: Database error 500");
  });

  test("should return Ok value directly", () => {
    const result = Ok("success");

    const output = matchErr(result)
      .on(NotFound, () => "handled")
      .otherwise(() => "fallback");

    expect(output).toBe("success");
  });

  test("should match wrapped external errors", () => {
    const expiredAt = new Date("2025-01-01");
    const result = Err(new TokenExpiredError(expiredAt));

    const output = matchErr(result)
      .on(JwtError, (e) => `Expired at ${e.expiredAt.toISOString()}`)
      .otherwise(() => "Other error");

    expect(output).toBe("Expired at 2025-01-01T00:00:00.000Z");
  });
});

describe("createErrors", () => {
  test("should group multiple error factories", () => {
    const Errors = createErrors({
      validationErr: { message: (field: string) => `Invalid ${field}` },
      timeoutErr: { message: (ms: number) => `Timed out after ${ms}ms` },
    });

    const err = Errors.validationErr("email");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("validationErr");
    expect(err.message).toBe("Invalid email");
    expect(err.args).toEqual(["email"]);

    const timeoutMs = 5000;
    const err2 = Errors.timeoutErr(timeoutMs);
    expect(err2.name).toBe("timeoutErr");
    expect(err2.message).toBe("Timed out after 5000ms");
    expect(err2.args).toEqual([timeoutMs]);
  });

  test("should expose _type as union of error types", () => {
    const Errors = createErrors({
      notFound: { message: () => "Not found" },
      authErr: { message: (role: string) => `No access for ${role}` },
    });

    // _type exists and is a union
    const _type: typeof Errors._type = Errors.notFound() as typeof Errors._type;
    expect(_type).toBeInstanceOf(Error);
  });
});

describe("kind field", () => {
  test("should be present on TypedError instances", () => {
    const err = createError("MyErr", (s: string) => s)("test");
    expect(err.kind).toBe("MyErr");
  });

  test("should work with createErrors", () => {
    const Errors = createErrors({
      fooErr: { message: () => "foo" },
      barErr: { message: () => "bar" },
    });

    expect(Errors.fooErr().kind).toBe("fooErr");
    expect(Errors.barErr().kind).toBe("barErr");
  });
});

describe("exhaustive runtime", () => {
  test("should throw on unhandled error", () => {
    const ErrX = createError("X", () => "x error");
    const errY = createError("Y", () => "y");
    const result = Err(ErrX());

    expect(() =>
      matchErr(result)
        .on(errY, () => "y handled")
        .exhaustive(),
    ).toThrow("x error");
  });

  test("should return Ok value directly without handlers", () => {
    const value = 42;
    const result = Ok(value);
    const output = matchErr(result).exhaustive();
    expect(output).toBe(value);
  });
});

describe("matchErr builder — ordering", () => {
  test("should match first matching handler", () => {
    const result = Err(DbError(dbErrorCode));

    const output = matchErr(result)
      .on(NotFound, (e) => `Missing: ${e.args[0]}`)
      .on(DbError, (e) => `DB: code ${e.args[0]}`)
      .otherwise(() => "Other");

    expect(output).toBe("DB: code 500");
  });

  test("should chain multiple .on() calls", () => {
    const result = Err(NotFound("test"));

    const output = matchErr(result)
      .on(DbError, () => "db")
      .on(NotFound, (e) => `found: ${e.args[0]}`)
      .otherwise(() => "other");

    expect(output).toBe("found: test");
  });
});
