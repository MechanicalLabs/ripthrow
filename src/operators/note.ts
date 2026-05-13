import type { Report, ReportOptions } from "../report";
import { createReport, isReport } from "../report";
import type { Result } from "../types/result";
import { mapErr } from "./map-err";

/**
 * Appends a contextual note to a Result's error.
 *
 * If the error is already a `Report`, the note is appended to its `notes` array.
 * Otherwise, the error is wrapped in a `Report` with the note as the first entry.
 * The original error's `message` and `help` are preserved.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param result The Result to attach a note to.
 * @param msg The note message to append.
 * @returns A Result with the same success value or a Report with the appended note.
 *
 * @category Operators
 * @example
 * const res = build(safe(fn))
 *   .mapErr(err => note(err, "failed to fetch from db"))
 *   .mapErr(err => note(err, "user id: 42"))
 *   .unwrapOr(default);
 * // res.error.notes → ["failed to fetch from db", "user id: 42"]
 */
export function note<T, E>(result: Result<T, E>, msg: string): Result<T, Report> {
  return mapErr(result, (err) => {
    let existingNotes: string[] = [];
    if (isReport(err) && err.notes) {
      existingNotes = err.notes;
    }

    let help: string | undefined;
    if (err && typeof err === "object") {
      // biome-ignore lint/nursery/useDestructuring: safe access via type guard
      help = (err as { help?: string }).help;
    }

    // biome-ignore lint/nursery/noTernary: more readable than if/else for this case
    const message: string = err instanceof Error ? err.message : String(err);

    const options: ReportOptions = {
      help,
      cause: err,
      notes: [...existingNotes, msg],
    };

    return createReport(message, options) as Report;
  });
}
