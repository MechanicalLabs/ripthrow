import { Report, type ReportOptions } from "../report";

/**
 * Creates a new Report instance.
 * Useful for generating structured errors to be wrapped in an Err result.
 *
 * @param message The error message.
 * @param options Additional report options.
 * @returns A new Report instance.
 *
 * @category Factories
 * @example
 * return Err(bail("Permission denied", { help: "Check your API token" }));
 */
export function bail(message: string, options?: ReportOptions): Report {
  return new Report(message, options);
}
