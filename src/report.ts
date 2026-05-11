/**
 * Options for creating a new Report.
 *
 * @category Error Handling
 * @template C The type of the context metadata.
 */
export interface ReportOptions<C extends Record<string, unknown> = Record<string, unknown>> {
  /** The underlying cause of the error. */
  cause?: unknown;
  /** A helpful message for the user on how to resolve the error. */
  help?: string | undefined;
  /** Additional key-value pairs to provide more context. */
  context?: C | undefined;
}

/**
 * A structured error object that supports causes, help messages, and context.
 * Inspired by Rust's `anyhow` or `eyre`.
 *
 * @category Error Handling
 * @template C The type of the context metadata.
 */
export interface Report<C extends Record<string, unknown> = Record<string, unknown>> {
  /** The error name, always "Report". */
  name: "Report";
  /** The error message. */
  message: string;
  /** A helpful message for the user on how to resolve the error. */
  help?: string;
  /** Additional key-value pairs to provide more context. */
  context?: C;
  /** The underlying cause of the error. */
  cause?: unknown;
  /** The stack trace. */
  stack?: string;
}

/**
 * Creates a new Report instance.
 *
 * @param message The error message.
 * @param options Additional options for the report.
 * @returns A new Report object.
 */
export function createReport<C extends Record<string, unknown> = Record<string, unknown>>(
  message: string,
  options: ReportOptions<C> = {},
): Report<C> {
  const err = new Error(message);
  err.name = "Report";
  const report = err as unknown as Report<C>;
  if (options.help !== undefined) {
    report.help = options.help;
  }
  if (options.context !== undefined) {
    report.context = options.context;
  }
  if (options.cause) {
    report.cause = options.cause;
  }
  return report;
}

/**
 * Checks if a value is a Report.
 *
 * @param err The value to check.
 * @returns True if the value is a Report.
 */
export function isReport(err: unknown): err is Report {
  return err !== null && typeof err === "object" && (err as Report).name === "Report";
}

/**
 * Creates a Report from an unknown error.
 * If the error is already a Report and no new information is provided, it returns it as is.
 *
 * @param err The original error.
 * @param message An optional new message.
 * @param options Additional options.
 * @returns A Report instance.
 */
export function reportFrom<T extends Record<string, unknown> = Record<string, unknown>>(
  err: unknown,
  message?: string,
  options: ReportOptions<T> = {},
): Report<T> {
  if (isReport(err) && !message && !options.help && !options.context) {
    return err as Report<T>;
  }

  let baseMessage: string;
  if (message) {
    baseMessage = message;
  } else if (err instanceof Error) {
    baseMessage = err.message;
  } else {
    baseMessage = String(err);
  }

  return createReport(baseMessage, { cause: err, ...options });
}
