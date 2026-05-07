# Getting Started

This guide covers the basics of using `ripthrow` to handle errors effectively.

## Installation

```bash
bun add ripthrow
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
