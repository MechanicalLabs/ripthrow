import type { Result } from "../types";

/**
 * Unwraps a Result, returning the success value or throwing the error.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to unwrap.
 * @returns The success value.
 * @throws The error contained in the Result if it's an Err.
 *
 * @category Consumers
 * @see unwrapOr
 * @example
 * const val = unwrap(Ok(42)); // 42
 * const val = unwrap(Err("failed")); // throws "failed"
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }

  throw result.error;
}
