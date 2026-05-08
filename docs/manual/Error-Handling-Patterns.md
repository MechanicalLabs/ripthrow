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

## Enriching Errors with `context`

The `context` operator wraps an error into a `Report`, preserving the original error as `.cause`:

```typescript
import { safe, context } from "ripthrow";

const result = context(
  safe(() => JSON.parse(raw)),
  "Failed to parse config",
  "Check your JSON syntax",
);
```

You can also pass metadata — merged with any `_metadata` from the original error:

```typescript
const result = context(
  safe(() => JSON.parse(raw)),
  "Failed to parse config",
  "Check your JSON syntax",
  { status: 400 },
);
// Report.context → { status: 400 }
```

Or via the builder API:

```typescript
build(safe(() => JSON.parse(raw)))
  .context("Failed to parse config", "Check your JSON syntax", { status: 400 });
```

## Fluent Chaining with `ResultBuilder`

Chain operations with the builder API for more readable code:

```typescript
import { ResultBuilder } from "ripthrow";

const name = ResultBuilder.safe(() => JSON.parse(input))
  .context("Invalid JSON", "Check the input format")
  .map((data: any) => data.user?.name ?? "Anonymous")
  .unwrap();
```

## Async Fluent Chaining with `AsyncResultBuilder`

For async operations, use `AsyncResultBuilder`:

```typescript
import { AsyncResultBuilder } from "ripthrow";

const user = await AsyncResultBuilder.safeAsync(fetch("/api/user"))
  .andThen((res) => AsyncResultBuilder.safeAsync(res.json()))
  .map((data: any) => data.name)
  .unwrapOr("Anonymous");
```

The `andThen` and `orElse` methods accept both sync `Result` and async `Promise<Result>`, so you can mix them freely.

## Advanced Pipeline

A real-world pipeline combining multiple patterns:

```typescript
import { ResultBuilder } from "ripthrow";

const result = ResultBuilder.safe(() => JSON.parse(raw))
  .context("Parse error", "Ensure valid JSON")
  .andThen((data: any) =>
    data.id
      ? ResultBuilder.ok(data)
      : ResultBuilder.err("Missing id field"),
  )
  .context("Validation error")
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

When enriched via `.context()`, the `_metadata` is merged into the `Report.context`. Use `kindOf()` to extract the `.kind` from any ripthrow error (traverses `.cause` for `Report`).

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
