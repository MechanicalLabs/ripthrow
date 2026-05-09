# ripthrow

[![npm version](https://img.shields.io/npm/v/ripthrow.svg?style=flat-square)](https://www.npmjs.com/package/ripthrow)
[![CI status](https://img.shields.io/github/actions/workflow/status/MechanicalLabs/ripthrow/ci.yml?branch=main&style=flat-square)](https://github.com/MechanicalLabs/ripthrow/actions/workflows/ci.yml)
![Bundle Size](https://img.shields.io/badge/bundle_size-~5.7_KB-blue?style=flat-square)
[![License](https://img.shields.io/github/license/MechanicalLabs/ripthrow?style=flat-square)](https://github.com/MechanicalLabs/ripthrow/blob/main/LICENSE)

**Zero-dependency, type-safe error handling for TypeScript.**

`ripthrow` is a lightweight library inspired by Rust's `Result` type and the proposed ECMAScript `?=` operator. It allows you to handle success and failure in a structured way, avoiding `try/catch` blocks and making error states explicit in your types.

## Features

- **Type-Safe:** Full TypeScript support with robust type inference.
- **Functional API:** Chain operations with `map`, `andThen`, and `orElse`.
- **Safe Wrappers:** Convert throwing functions and Promises into `Result` types easily.
- **No Dependencies:** Extremely small footprint.
- **Documentation:** Built-in JSDoc with examples and a complete Wiki.

## Installation

```bash
bun add ripthrow
# or
npm install ripthrow
```

## Quick Start

### Explicit errors with `Ok` and `Err`

Functions return `Result`, making failure paths visible in the type signature:

```typescript
import { Ok, Err, match, type Result } from "ripthrow";

function getUser(id: string): Result<{ id: string; name: string }, string> {
  if (!id) {
     return Err("ID is required");
  }

  return Ok({ id, name: "Alice" });
}

const result = getUser("123");

match(result, {
  ok: (user) => console.log(user.name),
  err: (msg) => console.error(`getUser function failed: ${msg}`),
});
```

### Wrap throwing code with `safe`

`safe` catches exceptions and returns a `Result` — no `try/catch`:

```typescript
import { safe, build } from "ripthrow";

const raw = '{"valid": true}';

const isValid = build(safe(() => JSON.parse(raw)))
  .map((data: any) => data.valid)
  .unwrapOr(false);

console.log(isValid); // true
```

## Why ripthrow?

Handling errors with exceptions can lead to "hidden" control flows. `ripthrow` forces you to acknowledge potential failures, leading to more resilient applications. Whether you are parsing JSON, fetching data, or performing complex logic, `ripthrow` ensures your error handling is as clean as your success path.

## Benchmarks

All benchmarks run on Bun 1.3 via [tinybench](https://github.com/tinylibs/tinybench) (`bun run bench`).
Higher ops/s = faster. Latency is per-operation (lower is better).

### Construction

| Pattern | ops/s | Latency | vs native |
|---------|------:|--------:|----------:|
| `Ok()` | 25,106,258 | 43.7 ns | — |
| `Err()` | 25,330,770 | 43.5 ns | — |
| `throw` | 1,182,372 | 1076.0 ns | **22× slower** |
| `{ ok: true }` manual | 25,110,815 | 43.8 ns | identical |

> `Ok`/`Err` are object literals — zero overhead vs writing the union manually.
> `throw` is the expensive one (Error object creation), not ripthrow.

### Wrapping (`safe` vs `try/catch`)

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `safe(success)` | 21,364,164 | 54.3 ns |
| `try/catch` (no throw) | 25,834,736 | 41.5 ns |
| `safe(throws)` | 809,722 | 1513.3 ns |
| `try/catch` (throw) | 1,137,303 | 1154.6 ns |
| `safeAsync(success)` | 3,179,026 | 349.5 ns |
| `try/catch async` (success) | 3,128,980 | 356.4 ns |

> `safe` adds <15 ns vs raw try/catch on the success path.
> On throws, both are bottlenecked by Error object creation — ripthrow is not the overhead.
> Async paths are identical (bottleneck is Promise scheduling).

### Mapping & Chaining

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `map` x5 | 13,822,582 | 90.6 ns |
| `if/else` x5 (native) | 19,130,552 | 64.6 ns |
| `andThen` chain | 19,259,304 | 57.7 ns |
| `orElse` fallback | 21,331,229 | 52.5 ns |
| builder chain (5 ops) | 18,372,064 | 61.2 ns |

> Functional overhead is ~3-5 ns per function call. The builder (fluent API) adds
> roughly 1-2 ns per method call — effectively zero.

### Matching vs `try/catch`

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `match(Ok)` | 23,395,940 | 46.9 ns |
| `match(Err)` | 23,228,941 | 46.1 ns |
| `try/catch` (no throw) | 25,834,736 | 41.5 ns |
| `try/catch` (throw) | 1,137,303 | 1154.6 ns |

> `match` is within 15% of raw try/catch on the success path.
> On error paths, `match` is **20× faster** than try/catch with a thrown error.

### Collections

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `all(5 ok)` | 9,896,702 | 120.3 ns |
| `all(5, last err)` | 13,444,957 | 91.8 ns |
| `any(5 ok)` | 15,383,201 | 79.1 ns |

### Pattern Matching (`matchErr`)

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `matchErr` (hit — creates Error) | 1,005,546 | 1175.9 ns |
| `matchErr` (miss — instanceof only) | 14,971,304 | 80.0 ns |

> The "hit" path creates the matched `TypedError`, which is the same cost as `new Error()`.
> The "miss" path is just an `instanceof` check — 15M ops/s.

### Context

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `context()` wrap | 1,198,643 | 1035.6 ns |
| `context()` with help | 1,162,701 | 1137.3 ns |

> Creating structured `Report` objects has the same cost as `new Error` (~1 µs).

### Real-World Patterns

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| parse JSON (ripthrow) | 7,746,842 | 141.6 ns |
| parse JSON (try/catch) | 8,546,584 | 126.5 ns |
| deep access (ripthrow) | 18,689,730 | 60.4 ns |
| deep access (try/catch) | 25,080,105 | 42.4 ns |
| legacy throw fn (ripthrow) | 18,203,471 | 63.3 ns |
| legacy throw fn (try/catch) | 25,927,726 | 40.8 ns |

> In real-world usage, ripthrow adds 15-20 ns per operation — well within the
> "zero overhead" claim for all practical purposes. The bottleneck is never
> the Result type, it's whatever you're doing inside `map`/`andThen`.

### Summary

- **`Ok`/`Err` = native object literal speed.** Same representation, same performance.
- **`map`/`andThen` = 1-5 ns overhead** per function call.
- **`match` = faster than try/catch** when errors are actually thrown.
- **`safe()` = same speed as manual try/catch** on success paths.
- **`matchErr` "miss" path = 15M ops/s**, "hit" path = Error construction speed.
- **Cost center is always `new Error()`**, not ripthrow.

> "Zero overhead" is not marketing — it's measured. ripthrow compiles down to
> object literal checks and function calls with no hidden allocation or
> prototype magic.
