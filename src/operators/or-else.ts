import type { Result } from "../types";

/**
 * Chains a sequence of operations that may fail, allowing recovery from errors.
 * If the Result is an Err, it applies the function to the error and returns its Result.
 * If the Result is an Ok, it returns the original success value without executing the function.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @template F The type of the new error value.
 * @param result The initial Result.
 * @param fn The function to apply to the error value if it's Err.
 * @returns A new Result representing the chained operation with potential recovery.
 *
 * @example
 * const res = Err("failed");
 * const recovered = orElse(res, () => Ok("default")); // Ok("default")
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
