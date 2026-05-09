import { Ok } from "../factories/ok";
import type { Result } from "../types";

/**
 * Maps a Result's success value using the provided function, leaving errors unchanged.
 * If the Result is an Err, the function is not executed and the original error is returned.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @template R The type of the new success value.
 * @param result The Result to map.
 * @param fn The function to apply to the success value if it's Ok.
 * @returns A new Result with the mapped success value or the original error.
 *
 * @category Operators
 * @see mapErr
 * @see andThen
 * @example
 * const res = Ok(1);
 * const doubled = map(res, (n) => n * 2); // Ok(2)
 */
export function map<T, E, R>(result: Result<T, E>, fn: (value: T) => R): Result<R, E> {
  if (result.ok) {
    return Ok<R, E>(fn(result.value));
  }

  return result;
}
