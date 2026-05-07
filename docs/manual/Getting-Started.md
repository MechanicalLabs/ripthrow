# Getting Started

This guide covers the basics of using `ripthrow` to handle errors effectively.

## Installation

```bash
bun add github:MechanicalLabs/ripthrow
```

## Core Concepts

In `ripthrow`, every operation that can fail returns a `Result<T, E>`.

- `Ok<T>` represents a success.
- `Err<E>` represents a failure.

## 1. Creating Results

### Manual Creation

```typescript
import { Ok, Err } from "ripthrow";

const success = Ok("Hello");
const failure = Err(new Error("Broken"));
```

### From Throwing Functions

Use `safe` to wrap synchronous code that might throw.

```typescript
import { safe } from "ripthrow";

const res = safe(() => JSON.parse(input));
```

### From Promises

Use `safeAsync` to handle asynchronous operations.

```typescript
import { safeAsync } from "ripthrow";

const res = await safeAsync(fetch("https://api.example.com"));
```

### Structured Errors with `bail`

`bail` creates a `Report` — an `Error` with a help message and extra context.

```typescript
import { Err, bail } from "ripthrow";

function getUser(id: string) {
  if (!id) return Err(bail("Missing user ID", {
    help: "Provide a valid user ID",
    context: { id },
  }));
  return Ok({ id, name: "Alice" });
}
```

## 2. Consuming Results

### Pattern Matching

The most robust way to extract data.

```typescript
import { match } from "ripthrow";

const message = match(res, {
  ok: (val) => `Data: ${val}`,
  err: (err) => `Failed: ${err.message}`
});
```

### Default Values

```typescript
import { unwrapOr } from "ripthrow";

const val = unwrapOr(res, "fallback");
```

### Throwing on Failure

If you are sure it won't fail (or want to crash if it does).

```typescript
import { unwrap } from "ripthrow";

const val = unwrap(res);
```

## 3. Fluent Chaining with `ResultBuilder`

Wrap a `Result` with `build()` to chain methods:

```typescript
import { Ok, build } from "ripthrow";

const result = build(Ok(1))
  .map((n) => n + 1)
  .andThen((n) => Ok(n.toString()))
  .unwrapOr("0");
```

Or use `ResultBuilder` directly with static constructors:

```typescript
import { ResultBuilder } from "ripthrow";

const result = ResultBuilder.safe(() => JSON.parse('{"a": 1}'))
  .map((data: any) => data.a)
  .unwrap();
```

### Attaching Context

```typescript
import { ResultBuilder } from "ripthrow";

const result = ResultBuilder.safe(() => JSON.parse(input))
  .context("Invalid JSON", "Check the file format")
  .unwrapOr({});
```

## 4. Async Chaining with `AsyncResultBuilder`

For async operations, use `AsyncResultBuilder`:

```typescript
import { AsyncResultBuilder } from "ripthrow";

const result = await AsyncResultBuilder.safeAsync(fetch("/api/user"))
  .map((res) => res.json())
  .unwrap();
```

Or use `buildAsync()`:

```typescript
import { safeAsync, buildAsync } from "ripthrow";

const result = await buildAsync(safeAsync(fetch("/api/user")))
  .andThen(async (res) => {
    const data = await res.json();
    return data.id ? Ok(data) : Err("Missing ID");
  })
  .unwrapOr(null);
```

The `andThen` and `orElse` callbacks in `AsyncResultBuilder` accept both sync `Result` and async `Promise<Result>`.
