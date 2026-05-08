/**
 * Extracts the error `kind` from any ripthrow error.
 * Handles TypedError directly and Report (traverses cause).
 *
 * @param err The error to extract the kind from.
 * @returns The error kind string, or undefined if not found.
 *
 * @category Utilities
 * @example
 * const kind = kindOf(err);
 * if (kind === "userNotFound") { ... }
 */
export function kindOf(err: unknown): string | undefined {
  if (err && typeof err === "object" && "kind" in err) {
    return (err as { kind: string }).kind;
  }
  if (err instanceof Error && err.cause && typeof err.cause === "object" && "kind" in err.cause) {
    return (err.cause as { kind: string }).kind;
  }
  // biome-ignore lint/complexity/noUselessUndefined: required by noImplicitReturns
  return undefined;
}
