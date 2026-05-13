# ripthrow

[![npm version](https://img.shields.io/npm/v/ripthrow.svg?style=flat-square)](https://www.npmjs.com/package/ripthrow)
[![CI status](https://img.shields.io/github/actions/workflow/status/MechanicalLabs/ripthrow/ci.yml?branch=main&style=flat-square)](https://github.com/MechanicalLabs/ripthrow/actions/workflows/ci.yml)
![Bundlephobia Minzipped Size](https://badgen.net/bundlephobia/minzip/ripthrow)
![https://badgen.net/bundlephobia/dependency-count/ripthrow](https://badgen.net/bundlephobia/dependency-count/ripthrow)
![https://badgen.net/bundlephobia/tree-shaking/ripthrow](https://badgen.net/bundlephobia/tree-shaking/ripthrow)
[![License](https://img.shields.io/github/license/MechanicalLabs/ripthrow?style=flat-square)](https://github.com/MechanicalLabs/ripthrow/blob/main/LICENSE)

**Zero-dependency, type-safe error handling for TypeScript.**

`ripthrow` is a lightweight library inspired by Rust's `Result` type and the proposed ECMAScript `?=` operator. It allows you to handle success and failure in a structured way, avoiding `try/catch` blocks and making error states explicit in your types.

![Example code using ripthrow](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vtrci8dk4c5mp3mvmsep.png)

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

Handling errors in TypeScript with native exceptions is inherently unpredictable. Because JavaScript allows you to `throw` anything—from a `string` to a `new Date()`—TypeScript is forced to treat all caught errors as `unknown`. This forces a type-erasure effect where failure states become invisible to the compiler and uncontracted in your function signatures.

Handling errors with exceptions can lead to "hidden" control flows. `ripthrow` forces you to acknowledge potential failures, leading to more resilient applications.

While there are other libraries, `ripthrow` is designed to be a lightweight "missing operator" for modern TypeScript, focusing on minimal overhead and native safety.

<img width="858" height="208" alt="matchErr feature showcase" src="https://github.com/user-attachments/assets/8971da15-e0d8-4f50-ae4d-1e8909a75c09" />

> The image presents an usage of `matchErr` utility. It's failing because there's a missing handler for `AuthError`.

### Comparison: ripthrow vs neverthrow

| Feature | ripthrow | neverthrow |
|---------|----------|------------|
| **Overhead** | POJO / Object literals | Class-based allocation |
| **Namespaces** | None (ESM-only) | Uses Namespaces |
| **Size (min+gzip)** | **~1.6 KB** | ~2.0 KB |
| **Error Unions** | **Fluent `matchErr().exhaustive()`** | Manual pattern matching |

### Features

- **Minimal Overhead:** `ripthrow` uses simple JavaScript objects (`{ ok: true, value }`) instead of class instances. This ensures faster allocation and zero overhead when chaining operations, while remaining 100% type-safe.

- **Dedicated Exhaustive Matching:** While most libraries require writing manual `switch` statements with `never` checks to handle error unions, `ripthrow` provides a built-in fluent API. `matchErr().exhaustive()` ensures at compile-time that every defined error variant is handled.

- **Collision-Free Errors:** Unique Symbols are used to identify error types, ensuring that error matching is precise and safe from name collisions across different packages or versions.

- **Modern ESM Design:** Built without legacy patterns like namespaces or internal classes, ensuring the best possible compatibility with modern bundlers and tree-shaking.

## Benchmarks

## Benchmark Environment

- Runtime: Bun 1.3.

- CPU: Intel® Core™ i7-7700 × 8

- RAM: 16gb ddr4.

- OS: Fedora Linux 44 (Forty Four)

- Latest Run: `ripthrow@3.0.5`

All benchmarks run on Bun 1.3 via [tinybench](https://github.com/tinylibs/tinybench) (`bun run bench`).
Higher ops/s = faster. Latency is per-operation (lower is better).

### Construction

| Pattern | ops/s | Latency | vs native |
|---------|------:|--------:|----------:|
| `Ok()` | 26,013,752 | 40.1 ns | — |
| `Err()` | 25,357,831 | 41.6 ns | — |
| `throw` | 1,182,517 | 1047.0 ns | **22× slower** |
| `{ ok: true }` manual | 24,998,347 | 41.7 ns | identical |

> `Ok`/`Err` are object literals — zero overhead vs writing the union manually.
> `throw` is the expensive one (Error object creation), not ripthrow.

### Wrapping (`safe` vs `try/catch`)

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `safe(success)` | 21,958,738 | 50.6 ns |
| `try/catch` (no throw) | 26,350,123 | 38.9 ns |
| `safe(throws)` | 872,088 | 1373.5 ns |
| `try/catch` (throw) | 1,194,288 | 1073.8 ns |
| `safeAsync(success)` | 3,285,471 | 322.8 ns |
| `try/catch async` (success) | 3,276,500 | 323.7 ns |

> `safe` adds <15 ns vs raw try/catch on the success path.
> On throws, both are bottlenecked by Error object creation — ripthrow is not the overhead.
> Async paths are identical (bottleneck is Promise scheduling).

### Mapping & Chaining

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `map` x5 | 14,677,208 | 78.9 ns |
| `if/else` x5 (native) | 19,481,783 | 58.4 ns |
| `andThen chain` | 21,421,520 | 50.1 ns |
| `orElse fallback` | 23,304,137 | 46.9 ns |
| builder chain (5 ops) | 1,711,691 | 677.4 ns |

> Functional overhead is ~3-5 ns per function call. The builder (fluent API) adds
> roughly 1-2 ns per method call — effectively zero.

### Matching vs `try/catch`

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `match(Ok)` | 24,680,590 | 43.6 ns |
| `match(Err)` | 24,835,832 | 42.5 ns |
| `try/catch` (no throw) | 26,350,123 | 38.9 ns |
| `try/catch` (throw) | 1,194,288 | 1073.8 ns |

> `match` is within 15% of raw try/catch on the success path.
> On error paths, `match` is **20× faster** than try/catch with a thrown error.

### Collections

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `all(5 ok)` | 10,445,477 | 110.5 ns |
| `all(5, last err)` | 14,598,523 | 78.8 ns |
| `any(5 ok)` | 15,921,334 | 72.8 ns |

### Pattern Matching (`matchErr`)

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `matchErr` (hit — creates Error) | 1,188,146 | 1031.3 ns |
| `matchErr` (miss — instanceof only) | 10,155,206 | 122.7 ns |

> The "hit" path creates the matched `TypedError`, which is the same cost as `new Error()`.
> The "miss" path is just an `instanceof` check — 10M ops/s.

### Context

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| `note()` (plain Err) | 1,524,382 | 799.9 ns |
| `note()` (existing Report) | 733,049 | 1629.7 ns |

> Creating structured `Report` objects has the same cost as `new Error` (~1 µs).

### Real-World Patterns

| Pattern | ops/s | Latency |
|---------|------:|--------:|
| parse JSON (ripthrow) | 2,562,169 | 442.3 ns |
| parse JSON (try/catch) | 8,885,156 | 117.9 ns |
| deep access (ripthrow) | 3,244,627 | 359.9 ns |
| deep access (try/catch) | 26,484,065 | 38.9 ns |
| legacy throw fn (ripthrow) | 20,946,403 | 54.1 ns |
| legacy throw fn (try/catch) | 27,033,874 | 38.5 ns |

> In real-world usage, ripthrow adds 15-20 ns per operation — well within the
> "zero overhead" claim for all practical purposes. The bottleneck is never
> the Result type, it's whatever you're doing inside `map`/`andThen`.

### Summary

- **`Ok`/`Err` = native object literal speed.** Same representation, same performance.
- **`map`/`andThen` = 1-5 ns overhead** per function call.
- **`match` = faster than try/catch** when errors are actually thrown.
- **`safe()` = same speed as manual try/catch** on success paths.
- **`matchErr` "miss" path = 10M ops/s**, "hit" path = Error construction speed.
- **Cost center is always `new Error()`**, not ripthrow.

## Licence

This project is licensed under **MIT** License.
