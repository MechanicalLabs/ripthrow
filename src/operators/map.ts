import { Ok } from "../factories/ok";
import type { Result } from "../types";

/**
 * Maps a Result's success value using the provided function, leaving errors unchanged.
 * @param result The Result to map.
 * @param fn The function to apply to the success value if it's Ok.
 * @returns A new Result with the mapped success value or the original error.
 */
export function map<T, E, R>(result: Result<T, E>, fn: (value: T) => R): Result<R, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }

  return result;
}
