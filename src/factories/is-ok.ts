import type { Result } from "../types";

/**
 * A type guard that checks if a Result is an Ok.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to check.
 * @returns `true` if the result is an Ok, `false` otherwise.
 *
 * @category Factories
 * @example
 * if (isOk(res)) {
 *   console.log(res.value); // res.value is typed as T
 * }
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}
