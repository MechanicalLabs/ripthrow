import type { Result } from "../types";

/**
 * Matches a Result against different handlers for Ok and Err cases.
 * @param result The Result to match.
 * @param handlers The handlers for Ok and Err cases.
 * @returns The result of the appropriate handler.
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
