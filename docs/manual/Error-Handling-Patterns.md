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
