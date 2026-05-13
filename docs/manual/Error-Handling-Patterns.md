# Error Handling Patterns

Learn how to solve common problems using `ripthrow`.

## Working with Arrays

### Combining multiple results

If you have an array of results and want to ensure all succeeded:

```typescript
import { all, Ok, Err } from "ripthrow";

const results = [Ok(1), Ok(2)];
const combined = all(results); // Ok([1, 2])
```

### Racing results

Get the first success:

```typescript
import { any, Ok, Err } from "ripthrow";

const res = any([Err("a"), Ok(1), Ok(2)]); // Ok(1)
```

## Filtering Arrays

Use Type Guards to filter successful values safely.

```typescript
import { isOk } from "ripthrow";

const values = results
  .filter(isOk)
  .map(r => r.value);
```

## Structured Errors with `Report`

Use `bail` to create rich errors with help text and context:

```typescript
import { Err, bail } from "ripthrow";

function parseConfig(raw: string) {
  try {
    return Ok(JSON.parse(raw));
  } catch (e) {
    return Err(bail("Invalid configuration", {
      help: "Verify the file is valid JSON",
      context: { raw: raw.slice(0, 100) },
      cause: e,
    }));
  }
}
```

## Enriching Errors with `note`

The `note` operator appends contextual notes to an error without overwriting its message or help text. It wraps the error in a `Report` if it isn't one already:

```typescript
import { safe, note } from "ripthrow";

const result = note(
  safe(() => JSON.parse(raw)),
  "Failed to parse config",
);
// Report.notes → ["Failed to parse config"]
```

Notes accumulate:

```typescript
const result = note(
  note(safe(() => JSON.parse(raw)), "Step 1 failed"),
  "Step 2 failed",
);
// Report.notes → ["Step 1 failed", "Step 2 failed"]
```

Or via the builder API:

```typescript
build(safe(() => JSON.parse(raw)))
  .note("Failed to parse config");
```

## Fluent Chaining with `ResultBuilder`

Chain operations with the builder API for more readable code:

```typescript
import { ResultBuilder } from "ripthrow";

const name = ResultBuilder.safe(() => JSON.parse(input))
  .note("Invalid JSON")
  .map((data: any) => data.user?.name ?? "Anonymous")
  .unwrap();
```

Or use the `build()` function to start from an existing `Result`:

```typescript
import { safe, build } from "ripthrow";

const name = build(safe(() => JSON.parse(input)))
  .note("Invalid JSON")
  .map((data: any) => data.user?.name ?? "Anonymous")
  .unwrap();
```

## Async Fluent Chaining with `AsyncResultBuilder`

For async operations, use `AsyncResultBuilder` or `buildAsync()`:

```typescript
import { AsyncResultBuilder } from "ripthrow";

const user = await AsyncResultBuilder.safeAsync(fetch("/api/user"))
  .andThen(async (res) => {
    const json = await res.json();
    return Ok(json);
  })
  .map((data: any) => data.name)
  .unwrapOr("Anonymous");
```

The `andThen` and `orElse` callbacks accept both sync `Result` and async `Promise<Result>`, so you can mix them freely.

## Advanced Pipeline

A real-world pipeline combining multiple patterns:

```typescript
import { ResultBuilder } from "ripthrow";

const result = ResultBuilder.safe(() => JSON.parse(raw))
  .note("Parse error")
  .andThen((data: any) =>
    data.id
      ? ResultBuilder.ok(data)
      : ResultBuilder.err("Missing id field"),
  )
  .note("Validation error")
  .map((data: any) => ({ id: data.id, name: data.name }))
  .unwrapOr({ id: "", name: "fallback" });
```

## Custom Typed Errors with `createError`

Define errors with typed args and interpolated messages:

```typescript
import { createError, matchErr, type ErrFactory } from "ripthrow";

const NotFound = createError(
  "NotFound",
  (id: string) => `User "${id}" not found`,
  (id: string) => `Check user ID "${id}"`,
);

const AuthError = createError(
  "AuthError",
  (role: string, resource: string) =>
    `Role "${role}" cannot access "${resource}"`,
);

function getUser(id: string) {
  if (!id) return Err(NotFound(id));
  return Ok({ name: "Alice" });
}
```

Match exhaustively with the builder — the handler receives the typed error with `.args`:

```typescript
matchErr(getUser(id))
  .on(NotFound, (e) => `Missing: ${e.args[0]}`)
  .on(AuthError, (e) => `Auth failed for ${e.args[0]} on ${e.args[1]}`)
  .otherwise((e) => `Unknown error: ${e.message}`);
```

## Grouping Errors with `createErrors`

Define all your app errors in one place, like `thiserror`:

```typescript
const Errors = createErrors({
  NotFound: { message: (id: string) => `User "${id}" not found` },
  DbError:  { message: (code: number) => `Database error ${code}` },
});

type AppError = typeof Errors._type;
```

Each factory carries typed args and a `kind` discriminant — `Errors.NotFound(id)` creates `TypedError<[string], "NotFound">` with `.kind === "NotFound"`, usable in discriminated unions.

Each error can carry optional `_metadata`:

```typescript
const Errors = createErrors({
  NotFound: {
    message: (id: string) => `User "${id}" not found`,
    help: () => "Verify the user ID",
    _metadata: { status: 404 },
  },
});
```

When enriched via `createReport()` or `reportFrom()`, the `_metadata` is merged into the `Report.context`. Use `kindOf()` to extract the `.kind` from any ripthrow error (traverses `.cause` for `Report`).

## Wrapping Library Errors

Use `wrapError` to match external Error classes:

```typescript
import { wrapError } from "ripthrow";
import { PrismaClientKnownRequestError } from "@prisma/client";

const PrismaErr = wrapError(PrismaClientKnownRequestError);

function handleDb(result: Result<User, Error>) {
  return matchErr(result)
    .on(PrismaErr, (e) => `DB error ${e.code}: ${e.message}`)
    .otherwise((e) => `Generic: ${e.message}`);
}
```

The handler receives the full class instance with all its typed properties intact.

## Exhaustive Error Handling with `.exhaustive()`

When you have handled all possible error variants, use `.exhaustive()` instead of `.otherwise()`. **At compile time**, TypeScript checks that every `kind` in the error union has a matching `.on()` handler. If a variant is missing, `.exhaustive()` returns an incompatible type and your code won't compile:

```typescript
type AppError = typeof NotFound | typeof AuthError | typeof DbError;

matchErr(result)
  .on(NotFound, (e) => handleMissing(e))
  .on(AuthError, (e) => handleAuth(e))
  .on(DbError, (e) => handleDb(e))
  .exhaustive(); // ✅ compiles — all variants handled
```

If you skip a variant, the call produces a type error at the call site.
