import type { Result } from "../types";

/**
 * Executes a side effect function if the Result is an Err.
 * The original Result is returned unchanged.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to tap into.
 * @param fn The function to execute with the error value.
 * @returns The original Result unchanged.
 *
 * @category Operators
 * @see tap
 * @example
 * safe(() => doSomething()).tapErr(err => logger.error(err))
 */
export function tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (!result.ok) {
    fn(result.error);
  }

  return result;
}
