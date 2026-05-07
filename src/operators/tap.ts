import type { Result } from "../types";

/**
 * Executes a side effect function if the Result is an Ok.
 * The original Result is returned unchanged.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to tap into.
 * @param fn The function to execute with the success value.
 * @returns The original Result unchanged.
 *
 * @category Operators
 * @see tapErr
 * @example
 * map(res, val => val + 1).tap(val => console.log(val))
 */
export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (result.ok) {
    fn(result.value);
  }
  return result;
}
