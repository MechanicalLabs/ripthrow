import { Err } from "../factories/err";
import { Ok } from "../factories/ok";
import type { Result } from "../types";

/**
 * Combines multiple Results into a single Result.
 * If all Results are Ok, returns an Ok with an array of all values.
 * If any Result is an Err, returns the first Err encountered.
 *
 * @template T The type of the success values.
 * @template E The type of the error value.
 * @param results An array of Results to combine.
 * @returns A Result with an array of values or the first error.
 *
 * @category Utilities
 * @see any
 * @example
 * const res = all([Ok(1), Ok(2)]); // Ok([1, 2])
 * const res = all([Ok(1), Err("fail")]); // Err("fail")
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const res of results) {
    if (!res.ok) {
      return Err(res.error);
    }
    values.push(res.value);
  }
  return Ok(values);
}
