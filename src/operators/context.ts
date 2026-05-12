import { type Report, type ReportOptions, reportFrom } from "../report";
import type { Result } from "../types/result";
import { mapErr } from "./map-err";

/**
 * Attaches context to a Result's error, converting it to a Report if it isn't one already.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @template C The type of the metadata.
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
export function context<T, E, C extends Record<string, unknown> = Record<string, unknown>>(
  result: Result<T, E>,
  message: string,
  help?: string,
  meta?: C,
): Result<T, Report<C>> {
  return mapErr(result, (err) => {
    let originalMeta: Record<string, unknown> | undefined;

    if (err && typeof err === "object") {
      originalMeta = (err as { _metadata?: Record<string, unknown> })._metadata;
    }

    const merged = { ...(originalMeta || {}), ...(meta || {}) };
    const keys = Object.keys(merged);

    // biome-ignore lint/nursery/noTernary: it's more readable
    const ctx: C | undefined = keys.length > 0 ? (merged as C) : undefined;

    return reportFrom(err, message, {
      help,
      context: ctx,
    } as ReportOptions<C>) as Report<C>;
  });
}
