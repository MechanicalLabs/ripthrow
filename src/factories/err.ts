import type { Result } from "../types";

/**
 * Constructs an error Result containing the given error.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param error The error to wrap in an Err result.
 * @returns A failed Result object `{ ok: false, error: E }`.
 *
 * @category Factories
 * @see Ok
 * @example
 * const res = Err("Something went wrong");
 * if (!res.ok) console.error(res.error); // "Something went wrong"
 */
export function Err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}
