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
 * A structured error class that supports causes, help messages, and context.
 * Inspired by Rust's `anyhow` or `eyre`.
 *
 * @category Error Handling
 * @template C The type of the context metadata.
 */
export class Report<C extends Record<string, unknown> = Record<string, unknown>> extends Error {
  /** A helpful message for the user on how to resolve the error. */
  readonly help?: string | undefined;
  /** Additional key-value pairs to provide more context. */
  readonly context?: C | undefined;

  constructor(message: string, options: ReportOptions<C> = {}) {
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
  static from<T extends Record<string, unknown> = Record<string, unknown>>(
    err: unknown,
    message?: string,
    options: ReportOptions<T> = {},
  ): Report<T> {
    if (err instanceof Report && !message && !options.help && !options.context) {
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

    return new Report(baseMessage, { cause: err, ...options });
  }
}
