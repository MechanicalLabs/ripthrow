import { Err } from "../factories/err";
import type { Result } from "../types";

/**
 * Returns the first Ok Result from an array of Results.
 * If all Results are Err, returns the last Err encountered (or a default error if empty).
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param results An array of Results to check.
 * @returns The first Ok result or the last Err.
 *
 * @category Utilities
 * @see all
 * @example
 * const res = any([Err("a"), Ok(1), Ok(2)]); // Ok(1)
 */
export function any<T, E>(results: Result<T, E>[]): Result<T, E> {
  if (results.length === 0) {
    return Err(new Error("any() called with an empty array") as unknown as E);
  }

  let lastErr: E | undefined;
  for (const res of results) {
    if (res.ok) {
      return res;
    }
    lastErr = res.error;
  }

  return Err(lastErr as E);
}
