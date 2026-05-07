import { Err } from "../factories/err";
import type { Result } from "../types";

/**
 * Maps a Result's error value using the provided function, leaving successes unchanged.
 * If the Result is an Ok, the function is not executed and the original success value is returned.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @template F The type of the new error value.
 * @param result The Result to map.
 * @param fn The function to apply to the error value if it's Err.
 * @returns A new Result with the mapped error value or the original success.
 *
 * @category Operators
 * @see map
 * @see orElse
 * @example
 * const res = Err("not found");
 * const wrapped = mapErr(res, (e) => new Error(e)); // Err(Error("not found"))
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }

  return result;
}
