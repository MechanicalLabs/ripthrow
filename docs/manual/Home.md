# ripthrow Documentation

## Quick Navigation

- **[[Getting Started|Getting-Started]]**: Installation and your first results.
- **[[Functional Operators|Functional-Operators]]**: How to use `map`, `andThen`, and `tap`.
- **[[Error Handling Patterns|Error-Handling-Patterns]]**: Best practices and advanced utilities like `all` and `any`.
- **[[API Reference|Home]]**: Auto-generated documentation from JSDoc.

## Why use Result instead of Throw?

Exceptions are effectively `GOTO` statements that can jump over many layers of your application. This makes reasoning about state difficult.

By using `Result`, failures become part of your function signatures:

```typescript
// Traditional
function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

// With ripthrow
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err("Division by zero");
  return Ok(a / b);
}
```

Now, the caller **must** handle the error or explicitly propagate it, leading to fewer runtime crashes.
