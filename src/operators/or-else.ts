import type { Result } from "../types";

/**
 * Chains a sequence of operations that may fail, short-circuiting on the first error, and allowing error transformation.
 * @param result The initial Result.
 * @param fn The function to apply to the error value if it's Err.
 * @returns A new Result representing the chained operation with potential error transformation.
 */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>,
): Result<T, F> {
  if (!result.ok) {
    return fn(result.error);
  }

  return result;
}
