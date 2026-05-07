# Functional Operators

`ripthrow` allows you to transform and chain Results without nesting `if` statements.

## Transformation

### map

Transform the success value.

```typescript
import { safe, map } from "ripthrow";

const res = safe(() => "1")
  .map(s => parseInt(s)); // Result<number, Error>
```

### mapErr

Transform the error value.

```typescript
import { safe, mapErr } from "ripthrow";

const res = safe(() => doSomething())
  .mapErr(e => new CustomError(e.message));
```

## Chaining

### andThen (flatMap)

Chain operations that also return a Result.

```typescript
import { safe, andThen } from "ripthrow";

const res = safe(() => "user_id")
  .andThen(id => fetchUser(id)); // fetchUser returns a Result
```

### orElse

Recover from an error by returning a new Result.

```typescript
import { safe, orElse, Ok } from "ripthrow";

const res = safe(() => fail())
  .orElse(err => Ok("recovered"));
```

## Side Effects

### tap

Execute code on success without changing the Result.

```typescript
res.tap(val => console.log("Success:", val));
```

### tapErr

Execute code on failure.

```typescript
res.tapErr(err => logger.error(err));
```
