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

## Complex Pipelines

```typescript
const result = await safeAsync(fetchData())
  .then(res => andThen(res, parseData))
  .then(res => map(res, transformData))
  .then(res => unwrapOr(res, defaultValue));
```
