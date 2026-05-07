import type { Result } from "../types";

/**
 * Constructs an error Result containing the given error.
 * @param error The error to wrap in an Err result.
 * @returns A Result object representing an error.
 */
export function Err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}
