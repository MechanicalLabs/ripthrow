import type { Result } from "../types";

/**
 * Unwraps a Result, returning the contained value if it's Ok, or a default value if it's Err.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to unwrap.
 * @param defaultValue The value to return if the Result is an Err.
 * @returns The contained value if Ok, otherwise the default value.
 *
 * @example
 * const res = Err("error");
 * const val = unwrapOr(res, "default"); // "default"
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }

  return defaultValue;
}
