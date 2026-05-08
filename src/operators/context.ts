import { Report } from "../report";
import type { Result } from "../types/result";
import { mapErr } from "./map-err";

/**
 * Attaches context to a Result's error, converting it to a Report if it isn't one already.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to attach context to.
 * @param message The context message.
 * @param help An optional help message.
 * @param meta Optional metadata to attach (merged with any _metadata from the original error).
 * @returns A Result with the same success value or a Report as the error.
 *
 * @category Operators
 * @example
 * const res = context(safe(() => JSON.parse(data)), "Failed to parse config");
 */
export function context<T, E>(
  result: Result<T, E>,
  message: string,
  help?: string,
  meta?: Record<string, unknown>,
): Result<T, Report> {
  return mapErr(result, (err) => {
    let originalMeta: Record<string, unknown> | undefined;
    if (err && typeof err === "object") {
      originalMeta = (err as { _metadata?: Record<string, unknown> })._metadata;
    }
    const merged = { ...(originalMeta || {}), ...(meta || {}) };
    const keys = Object.keys(merged);
    const ctx: Record<string, unknown> | undefined = keys.length > 0 ? merged : undefined;
    return Report.from(err, message, {
      help,
      context: ctx,
    });
  });
}
