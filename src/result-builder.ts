// biome-ignore-all lint/nursery/useExplicitType: inferred from ResultBuilder interface
// biome-ignore-all lint/nursery/useExplicitReturnType: inferred from ResultBuilder interface
import { match, unwrap, unwrapOr } from "./consumers";
import { Err, isErr, isOk, Ok, safe } from "./factories";
import {
  andThen,
  context as contextOp,
  mapErr,
  map as mapOp,
  note as noteOp,
  orElse,
  tapErr as tapErrOp,
  tap as tapOp,
} from "./operators";
import type { Report } from "./report";
import type { Result } from "./types";
import { all as allResults, any as anyResult } from "./utils";

/**
 * A fluent wrapper around the Result type that allows for method chaining.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 *
 * @category Builder
 */
export interface ResultBuilder<T, E> {
  /**
   * Returns the underlying raw Result type.
   */
  readonly result: Result<T, E>;

  /**
   * Returns true if the result is an Ok.
   */
  readonly isOk: boolean;

  /**
   * Returns true if the result is an Err.
   */
  readonly isErr: boolean;

  /**
   * Maps the success value if the result is Ok.
   */
  map: <R>(fn: (value: T) => R) => ResultBuilder<R, E>;

  /**
   * Maps the error value if the result is Err.
   */
  mapErr: <F>(fn: (error: E) => F) => ResultBuilder<T, F>;

  /**
   * Chains another operation that returns a Result.
   */
  andThen: <R>(fn: (value: T) => Result<R, E>) => ResultBuilder<R, E>;

  /**
   * Chains another operation that returns a Result if the current result is an Err.
   */
  orElse: <F>(fn: (error: E) => Result<T, F>) => ResultBuilder<T, F>;

  /**
   * Executes a side effect if the result is Ok.
   */
  tap: (fn: (value: T) => void) => ResultBuilder<T, E>;

  /**
   * Executes a side effect if the result is Err.
   */
  tapErr: (fn: (error: E) => void) => ResultBuilder<T, E>;

  /**
   * Matches the result against Ok and Err handlers.
   */
  match: <R>(handlers: { ok: (value: T) => R; err: (error: E) => R }) => R;

  /**
   * Unwraps the value or returns a default value.
   */
  unwrapOr: (defaultValue: T) => T;

  /**
   * Unwraps the value or throws the error.
   */
  unwrap: () => T;

  /**
   * Attaches context to the error if it exists.
   *
   * @deprecated Use {@link ResultBuilder.note} instead, which preserves the original
   * error message and help text while accumulating notes.
   */
  context: (
    message: string,
    help?: string,
    meta?: Record<string, unknown>,
  ) => ResultBuilder<T, Report>;

  /**
   * Appends a contextual note to the error.
   *
   * If the error is already a `Report`, the note is appended to its `notes` array.
   * The original `message` and `help` are preserved.
   *
   * @example
   * build(safe(fn))
   *   .note("failed to fetch from db")
   *   .note("user id: 42")
   *   .unwrapOr(default)
   */
  note: (msg: string) => ResultBuilder<T, Report>;
}

/**
 * Creates a `ResultBuilder` from a raw `Result` value.
 *
 * This is the low-level factory used internally by {@link build} and
 * {@link ResultBuilder}. All operations are evaluated eagerly on the
 * wrapped result.
 *
 * @param result The `Result<T, E>` to wrap.
 * @returns A `ResultBuilder` instance providing fluent chaining.
 *
 * @category Builder
 */
export function createResultBuilder<T, E>(result: Result<T, E>): ResultBuilder<T, E> {
  const builder: ResultBuilder<T, E> = {
    get result() {
      return result;
    },
    get isOk() {
      return isOk(result);
    },
    get isErr() {
      return isErr(result);
    },
    map: <R>(fn: (value: T) => R) => createResultBuilder(mapOp(result, fn)),
    mapErr: <F>(fn: (error: E) => F) => createResultBuilder(mapErr(result, fn)),
    andThen: <R>(fn: (value: T) => Result<R, E>) => createResultBuilder(andThen(result, fn)),
    orElse: <F>(fn: (error: E) => Result<T, F>) => createResultBuilder(orElse(result, fn)),
    tap: (fn: (value: T) => void) => {
      tapOp(result, fn);
      return builder;
    },
    tapErr: (fn: (error: E) => void) => {
      tapErrOp(result, fn);
      return builder;
    },
    match: <R>(handlers: { ok: (value: T) => R; err: (error: E) => R }) => match(result, handlers),
    unwrapOr: (defaultValue: T) => unwrapOr(result, defaultValue),
    unwrap: () => unwrap(result),
    context: (message: string, help?: string, meta?: Record<string, unknown>) =>
      createResultBuilder(contextOp(result, message, help, meta)),
    note: (msg: string) => createResultBuilder(noteOp(result, msg)),
  };
  return builder;
}

/**
 * Namespace object providing convenient static constructors for `ResultBuilder`.
 *
 * Use these to start a fluent chain without manually wrapping values in `Ok`/`Err`:
 *
 * ```ts
 * ResultBuilder.ok(42).map(n => n + 1).unwrap()    // 43
 * ResultBuilder.err("fail").unwrapOr("default")     // "default"
 * ResultBuilder.safe(() => JSON.parse(raw)).unwrap() // parsed value
 * ```
 *
 * Under the hood each method delegates to the corresponding factory function
 * and wraps the result in a `ResultBuilder` via {@link createResultBuilder}.
 *
 * @category Builder
 */
export const ResultBuilder = {
  /**
   * Creates a `ResultBuilder` wrapping a successful `Ok` result.
   *
   * @param args The success value. Omitted when `U` is `void`.
   * @returns A builder wrapping `Ok(value)`.
   * @example ResultBuilder.ok("hello").map(s => s.length).unwrap() // 5
   */
  ok: <U = void, F = unknown>(...args: undefined extends U ? [U?] : [U]): ResultBuilder<U, F> =>
    createResultBuilder(Ok<U, F>(...(args as [U]))),

  /**
   * Creates a `ResultBuilder` wrapping a failed `Err` result.
   *
   * @param error The error value.
   * @returns A builder wrapping `Err(error)`.
   * @example ResultBuilder.err("not found").unwrapOr("default")
   */
  err: <U = never, F = unknown>(error: F): ResultBuilder<U, F> =>
    createResultBuilder(Err<U, F>(error)),

  /**
   * Creates a `ResultBuilder` by wrapping a throwing function with {@link safe}.
   *
   * @param fn The function to execute and catch errors from.
   * @returns A builder wrapping the result of `safe(fn)`.
   * @example ResultBuilder.safe(() => JSON.parse(raw)).unwrap()
   */
  safe: <U>(fn: () => U): ResultBuilder<U, Error> => createResultBuilder(safe<U, Error>(fn)),

  /**
   * Combines multiple Results into a single builder via {@link all}.
   *
   * Returns `Ok` with an array of all success values, or the first `Err`.
   *
   * @param results A variadic tuple of Results.
   * @returns A builder wrapping the combined result.
   * @example ResultBuilder.all([Ok(1), Ok(2)]).unwrap() // [1, 2]
   */
  all: <V extends readonly Result<unknown, unknown>[]>(
    results: [...V],
  ): ResultBuilder<
    { [K in keyof V]: V[K] extends Result<infer Val, unknown> ? Val : never },
    V[number] extends Result<unknown, infer ErrV> ? ErrV : never
  > =>
    // biome-ignore lint/suspicious/noExplicitAny: complex tuple inference
    createResultBuilder(allResults(results)) as any,

  /**
   * Returns the first `Ok` Result from an array via {@link any}.
   *
   * If all Results are `Err`, returns the last error.
   *
   * @param results An array of Results to check.
   * @returns A builder wrapping the first Ok or last Err.
   * @example ResultBuilder.any([Err("a"), Ok(1)]).unwrap() // 1
   */
  any: <U, F>(results: Result<U, F>[]): ResultBuilder<U, F> =>
    createResultBuilder(anyResult(results)),
};

/**
 * Wraps a Result in a ResultBuilder for fluent chaining.
 *
 * @param result The Result to wrap.
 * @returns A ResultBuilder instance.
 *
 * @category Builder
 */
export function build<T, E>(result: Result<T, E>): ResultBuilder<T, E> {
  return createResultBuilder(result);
}
