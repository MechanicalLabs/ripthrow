import type { Result } from "../types";

/**
 * Matches a Result against different handlers for Ok and Err cases.
 * This pattern forces handling both success and failure states, similar to Rust's match.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @template R The type of the return value from the handlers.
 * @param result The Result to match.
 * @param handlers An object with `ok` and `err` functions.
 * @returns The result of the appropriate handler.
 *
 * @category Consumers
 * @see unwrapOr
 * @example
 * const output = match(res, {
 *   ok: (val) => `Success: ${val}`,
 *   err: (err) => `Failure: ${err}`
 * });
 */
export function match<T, E, R>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => R;
    err: (error: E) => R;
  },
): R {
  if (result.ok) {
    return handlers.ok(result.value);
  }

  return handlers.err(result.error);
}
