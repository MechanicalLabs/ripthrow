import type { Result } from "../types";

/**
 * Unwraps a Result, returning the contained value if it's Ok, or a default value if it's Err.
 * @param result The Result to unwrap.
 * @param defaultValue The value to return if the Result is an Err.
 * @returns The contained value if Ok, otherwise the default value.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }

  return defaultValue;
}
