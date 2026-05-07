import type { Result } from "../types";

/**
 * Chains a sequence of operations that may fail, short-circuiting on the first error.
 * If the Result is an Ok, it applies the function to the value and returns its Result.
 * If the Result is an Err, it returns the original error without executing the function.
 *
 * Also known as `flatMap` or `bind` in other functional contexts.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @template R The type of the new success value.
 * @param result The initial Result.
 * @param fn The function to apply to the success value if it's Ok.
 * @returns A new Result representing the chained operation.
 *
 * @category Operators
 * @see map
 * @example
 * const res = Ok("user_id");
 * const user = andThen(res, fetchUser); // fetchUser returns a Result
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
