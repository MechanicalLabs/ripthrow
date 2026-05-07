import { match } from "./consumers/match";
import { unwrap } from "./consumers/unwrap";
import { unwrapOr } from "./consumers/unwrap-or";
import { isErr } from "./factories/is-err";
import { isOk } from "./factories/is-ok";
import { andThen } from "./operators/and-then";
import { context as contextOp } from "./operators/context";
import { map } from "./operators/map";
import { mapErr } from "./operators/map-err";
import { orElse } from "./operators/or-else";
import { tap } from "./operators/tap";
import { tapErr } from "./operators/tap-err";
import type { Report } from "./report";
import type { Result } from "./types/result";

/**
 * A fluent wrapper around the Result type that allows for method chaining.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 *
 * @category Builder
 */
export class ResultBuilder<T, E> {
  private readonly _result: Result<T, E>;

  constructor(result: Result<T, E>) {
    this._result = result;
  }

  /**
   * Constructs a successful Result wrapped in a ResultBuilder.
   */
  static ok<U = void, F = unknown>(value?: U): ResultBuilder<U, F> {
    return new ResultBuilder({ ok: true, value: value as U });
  }

  /**
   * Constructs an error Result wrapped in a ResultBuilder.
   */
  static err<U, F>(error: F): ResultBuilder<U, F> {
    return new ResultBuilder({ ok: false, error });
  }

  /**
   * Executes a synchronous function and wraps the result in a ResultBuilder.
   */
  static safe<U, F = Error>(fn: () => U): ResultBuilder<U, F> {
    try {
      return ResultBuilder.ok(fn());
    } catch (e) {
      return ResultBuilder.err(e as F);
    }
  }

  /**
   * Converts a Promise into a ResultBuilder.
   */
  static async safeAsync<U, F = Error>(promise: Promise<U>): Promise<ResultBuilder<U, F>> {
    try {
      const data = await promise;
      return ResultBuilder.ok(data);
    } catch (e) {
      return ResultBuilder.err(e as F);
    }
  }

  /**
   * Combines multiple Results into a single ResultBuilder.
   */
  static all<U, F>(results: Result<U, F>[]): ResultBuilder<U[], F> {
    const values: U[] = [];
    for (const res of results) {
      if (!res.ok) {
        return ResultBuilder.err(res.error);
      }
      values.push(res.value);
    }
    return ResultBuilder.ok(values);
  }

  /**
   * Returns the first Ok Result from an array wrapped in a ResultBuilder.
   */
  static any<U, F>(results: Result<U, F>[]): ResultBuilder<U, F> {
    if (results.length === 0) {
      return ResultBuilder.err(new Error("any() called with an empty array") as unknown as F);
    }

    let lastErr: F | undefined;
    for (const res of results) {
      if (res.ok) {
        return new ResultBuilder(res);
      }
      lastErr = res.error;
    }

    return ResultBuilder.err(lastErr as F);
  }

  /**
   * Returns the underlying raw Result type.
   */
  get result(): Result<T, E> {
    return this._result;
  }

  /**
   * Returns true if the result is an Ok.
   */
  get isOk(): boolean {
    return isOk(this._result);
  }

  /**
   * Returns true if the result is an Err.
   */
  get isErr(): boolean {
    return isErr(this._result);
  }

  /**
   * Maps the success value if the result is Ok.
   */
  map<R>(fn: (value: T) => R): ResultBuilder<R, E> {
    return new ResultBuilder(map(this._result, fn));
  }

  /**
   * Maps the error value if the result is Err.
   */
  mapErr<F>(fn: (error: E) => F): ResultBuilder<T, F> {
    return new ResultBuilder(mapErr(this._result, fn));
  }

  /**
   * Chains another operation that returns a Result.
   */
  andThen<R>(fn: (value: T) => Result<R, E>): ResultBuilder<R, E> {
    return new ResultBuilder(andThen(this._result, fn));
  }

  /**
   * Chains another operation that returns a Result if the current result is an Err.
   */
  orElse<F>(fn: (error: E) => Result<T, F>): ResultBuilder<T, F> {
    return new ResultBuilder(orElse(this._result, fn));
  }

  /**
   * Executes a side effect if the result is Ok.
   */
  tap(fn: (value: T) => void): this {
    tap(this._result, fn);
    return this;
  }

  /**
   * Executes a side effect if the result is Err.
   */
  tapErr(fn: (error: E) => void): this {
    tapErr(this._result, fn);
    return this;
  }

  /**
   * Matches the result against Ok and Err handlers.
   */
  match<R>(handlers: { ok: (value: T) => R; err: (error: E) => R }): R {
    return match(this._result, handlers);
  }

  /**
   * Unwraps the value or returns a default value.
   */
  unwrapOr(defaultValue: T): T {
    return unwrapOr(this._result, defaultValue);
  }

  /**
   * Unwraps the value or throws the error.
   */
  unwrap(): T {
    return unwrap(this._result);
  }

  /**
   * Attaches context to the error if it exists.
   */
  context(message: string, help?: string): ResultBuilder<T, Report> {
    return new ResultBuilder(contextOp(this._result, message, help));
  }
}

/**
 * Wraps a Result in a ResultBuilder for fluent chaining.
 *
 * @param result The Result to wrap.
 * @returns A ResultBuilder instance.
 *
 * @category Builder
 */
export function build<T, E>(result: Result<T, E>): ResultBuilder<T, E> {
  return new ResultBuilder(result);
}
