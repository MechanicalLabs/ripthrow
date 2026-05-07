# ripthrow

**Zero-overhead, type-safe error handling for TypeScript.**

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

```typescript
import { safe, match } from "ripthrow";

const res = safe(() => JSON.parse('{"status": "ok"}'));

const message = match(res, {
  ok: (data) => `Success: ${data.status}`,
  err: (error) => `Error: ${error.message}`
});

console.log(message);
```

## Why ripthrow?

Handling errors with exceptions can lead to "hidden" control flows. `ripthrow` forces you to acknowledge potential failures, leading to more resilient applications. Whether you are parsing JSON, fetching data, or performing complex logic, `ripthrow` ensures your error handling is as clean as your success path.
