import type { Result } from "../types";

/**
 * A type guard that checks if a Result is an Err.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to check.
 * @returns `true` if the result is an Err, `false` otherwise.
 *
 * @category Factories
 * @example
 * if (isErr(res)) {
 *   console.error(res.error); // res.error is typed as E
 * }
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}
