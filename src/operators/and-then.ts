import type { Result } from "../types";

/**
 * Chains a sequence of operations that may fail, short-circuiting on the first error.
 * @param result The initial Result.
 * @param fn The function to apply to the success value if it's Ok.
 * @returns A new Result representing the chained operation.
 */
export function andThen<T, E, R>(
  result: Result<T, E>,
  fn: (value: T) => Result<R, E>,
): Result<R, E> {
  if (result.ok) {
    return fn(result.value);
  }

  return result;
}
