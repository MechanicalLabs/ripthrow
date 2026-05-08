# Functional Operators

`ripthrow` allows you to transform and chain Results without nesting `if` statements.

## Transformation

### map

Transform the success value.

```typescript
import { safe, map } from "ripthrow";

const res = safe(() => JSON.parse('"1"'));
const parsed = map(res, (s: string) => parseInt(s)); // Result<number, Error>
```

### mapErr

Transform the error value.

```typescript
import { safe, mapErr } from "ripthrow";

const res = safe(() => doSomething());
const wrapped = mapErr(res, (e) => new CustomError(e.message));
```

### context

Attach context to an error, converting it into a `Report` with a help message.

```typescript
import { safe, context } from "ripthrow";

const res = safe(() => JSON.parse(input));
const wrapped = context(res, "Failed to parse config", "Check your JSON syntax");
// Result<unknown, Report> — error is now a Report with .message, .help, .cause
```

Optionally attach metadata (merged with any `_metadata` from the original error):

```typescript
const wrapped = context(res, "Request failed", undefined, { status: 502 });
// Report.context → { status: 502 }
```

## Chaining

### andThen (flatMap)

Chain operations that also return a Result.

```typescript
import { safe, andThen, Ok } from "ripthrow";

const res = andThen(
  safe(() => JSON.parse('"user_id"')),
  (id) => Ok(`Hello, ${id}`),
); // Result<string, Error>
```

### orElse

Recover from an error by returning a new Result.

```typescript
import { safe, orElse, Ok } from "ripthrow";

const res = orElse(
  safe(() => { throw "fail"; }),
  (err) => Ok("recovered"),
); // Result<string, Error>
```

## Side Effects

### tap

Execute code on success without changing the Result.

```typescript
import { safe, tap } from "ripthrow";

const res = tap(safe(() => "hello"), (val) => console.log("Success:", val));
```

### tapErr

Execute code on failure.

```typescript
import { safe, tapErr } from "ripthrow";

const res = tapErr(safe(() => { throw "error"; }), (err) => logger.error(err));
```

## Fluent API

Wrap a `Result` with `build()` to chain methods instead of nesting calls:

```typescript
import { safe, build } from "ripthrow";

const result = build(safe(() => JSON.parse('{"a":1}')))
  .map((data: any) => data.a)
  .tap((n) => console.log("Parsed:", n))
  .unwrapOr(0);
```

Or use `ResultBuilder` static methods directly:

```typescript
import { ResultBuilder } from "ripthrow";

const result = ResultBuilder.safe(() => JSON.parse('{"a":1}'))
  .context("Invalid config")
  .andThen((data: any) => ResultBuilder.ok(data.a))
  .unwrapOr(0);
```

## Pipe

Compose operations with `pipe` — a functional alternative to the builder:

```typescript
import { safe, pipe, map, unwrapOr } from "ripthrow";

const result = await pipe(
  safe(() => JSON.parse('{"a":1}')),
  (r) => map(r, (data: any) => data.a),
  (r) => unwrapOr(r, 0),
);
```

Accepts both sync values and Promises:
```
