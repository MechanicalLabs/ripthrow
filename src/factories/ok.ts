import type { Result } from "../types";

/**
 * Constructs a successful Result containing the given value.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param value The value to wrap in an Ok result.
 * @returns A successful Result object `{ ok: true, value: T }`.
 *
 * @category Factories
 * @see Err
 * @example
 * const res = Ok(42);
 * if (res.ok) console.log(res.value); // 42
 */
export function Ok<T = void, E = unknown>(value?: T): Result<T, E> {
  return { ok: true, value: value as T };
}
