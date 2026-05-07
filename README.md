# ripthrow

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
bun add github:MechanicalLabs/ripthrow
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
