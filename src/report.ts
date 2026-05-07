/**
 * Options for creating a new Report.
 *
 * @category Error Handling
 */
export interface ReportOptions {
  /** The underlying cause of the error. */
  cause?: unknown;
  /** A helpful message for the user on how to resolve the error. */
  help?: string | undefined;
  /** Additional key-value pairs to provide more context. */
  context?: Record<string, unknown> | undefined;
}

/**
 * A structured error class that supports causes, help messages, and context.
 * Inspired by Rust's `anyhow` or `eyre`.
 *
 * @category Error Handling
 */
export class Report extends Error {
  /** A helpful message for the user on how to resolve the error. */
  readonly help?: string | undefined;
  /** Additional key-value pairs to provide more context. */
  readonly context?: Record<string, unknown> | undefined;

  constructor(message: string, options: ReportOptions = {}) {
    super(message);
    this.name = "Report";
    this.help = options.help;
    this.context = options.context;
    if (options.cause) {
      this.cause = options.cause;
    }
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
  static from(err: unknown, message?: string, options: ReportOptions = {}): Report {
    if (err instanceof Report && !message && !options.help && !options.context) {
      return err;
    }

    let baseMessage: string;
    if (message) {
      baseMessage = message;
    } else if (err instanceof Error) {
      baseMessage = err.message;
    } else {
      baseMessage = String(err);
    }

    return new Report(baseMessage, { cause: err, ...options });
  }
}
