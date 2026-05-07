import type { Result } from "../types";

/**
 * Constructs a successful Result containing the given value.
 * @param value The value to wrap in an Ok result.
 * @returns A Result object representing success.
 */
export function Ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}
