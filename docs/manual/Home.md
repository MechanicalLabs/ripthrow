# ripthrow Documentation

## Quick Navigation

- **[[Getting Started|Getting-Started]]**: Installation, `Ok`/`Err`, `safe`, `bail`, fluent and async builders.
- **[[Functional Operators|Functional-Operators]]**: `map`, `mapErr`, `andThen`, `orElse`, `tap`, `tapErr`, `note`.
- **[[Error Handling Patterns|Error-Handling-Patterns]]**: `all`, `any`, `Report`, `note`, `ResultBuilder`, `AsyncResultBuilder`, `createError`, `wrapError`, `matchErr`.
- **[[API Reference|API-Reference]]**: Auto-generated documentation from JSDoc.

## Why use Result instead of Throw?

Exceptions are effectively `GOTO` statements that can jump over many layers of your application. This makes reasoning about state difficult.

By using `Result`, failures become part of your function signatures:

```typescript
import { Ok, Err, type Result } from "ripthrow";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err("Division by zero");
  return Ok(a / b);
}
```

Now, the caller **must** handle the error or explicitly propagate it, leading to fewer runtime crashes.
