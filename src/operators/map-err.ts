import { Err } from "../factories/err";
import type { Result } from "../types";

/**
 * Maps a Result's error value using the provided function, leaving successes unchanged.
 * @param result The Result to map.
 * @param fn The function to apply to the error value if it's Err.
 * @returns A new Result with the mapped error value or the original success.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }

  return result;
}
