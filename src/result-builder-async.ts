// biome-ignore-all lint/nursery/useExplicitType: inferred from AsyncResultBuilder interface
// biome-ignore-all lint/nursery/useExplicitReturnType: inferred from AsyncResultBuilder interface
// biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: factory needs to build the builder
import { match, unwrap, unwrapOr } from "./consumers";
import { Err, isErr, isOk, Ok, safeAsync } from "./factories";
import {
  context as contextOp,
  mapErr,
  map as mapOp,
  note as noteOp,
  tapErr as tapErrOp,
  tap as tapOp,
} from "./operators";
import type { Report } from "./report";
import type { AsyncResult, Result } from "./types";

type Op = (
  r: Result<unknown, unknown>,
) => Result<unknown, unknown> | Promise<Result<unknown, unknown>>;

/**
 * A fluent async wrapper around the `Result` type that enables method chaining
 * on operations that return `Promise<Result<T, E>>`.
 *
 * Start with {@link buildAsync} or `AsyncResultBuilder.ok` / `.err` / `.safeAsync`,
 * then chain `.map()`, `.andThen()`, `.context()`, and finish with
 * `.unwrap()`, `.unwrapOr()`, or `.match()`.
 *
 * Callbacks in `.andThen()` and `.orElse()` accept both sync `Result` and
 * async `Promise<Result>` — you can `await` freely inside them.
 *
 * @template T The success type.
 * @template E The error type.
 *
 * @category Builder
 */
export interface AsyncResultBuilder<T, E> {
  readonly result: AsyncResult<T, E>;
  readonly isOk: Promise<boolean>;
  readonly isErr: Promise<boolean>;
  map: <R>(fn: (value: T) => R) => AsyncResultBuilder<R, E>;
  mapErr: <F>(fn: (error: E) => F) => AsyncResultBuilder<T, F>;
  andThen: <R>(fn: (value: T) => Result<R, E> | AsyncResult<R, E>) => AsyncResultBuilder<R, E>;
  orElse: <F>(fn: (error: E) => Result<T, F> | AsyncResult<T, F>) => AsyncResultBuilder<T, F>;
  tap: (fn: (value: T) => void) => AsyncResultBuilder<T, E>;
  tapErr: (fn: (error: E) => void) => AsyncResultBuilder<T, E>;
  /** @deprecated Use {@link AsyncResultBuilder.note} instead. */
  context: <C extends Record<string, unknown>>(
    message: string,
    help?: string,
    meta?: C,
  ) => AsyncResultBuilder<T, Report<C>>;

  /**
   * Appends a contextual note to the error.
   * The original `message` and `help` are preserved.
   */
  note: (msg: string) => AsyncResultBuilder<T, Report>;
  match: <R>(handlers: { ok: (value: T) => R; err: (error: E) => R }) => Promise<R>;
  unwrapOr: (defaultValue: T) => Promise<T>;
  unwrap: () => Promise<T>;
}

/**
 * Creates an `AsyncResultBuilder` from a raw `AsyncResult` (`Promise<Result<T, E>>`).
 *
 * Operations are **lazily queued** and only executed when the builder is consumed
 * (via `.unwrap()`, `.unwrapOr()`, `.match()`, `.result`, `.isOk`, or `.isErr`).
 * This avoids unnecessary promise chains when multiple transforms are composed.
 *
 * @param promise The async result promise to wrap.
 * @param ops Internal list of queued operations (used when chaining).
 * @returns An `AsyncResultBuilder` instance.
 *
 * @category Builder
 */
export function createAsyncResultBuilder<T, E>(
  promise: AsyncResult<T, E>,
  ops?: Op[],
): AsyncResultBuilder<T, E> {
  const _ops = ops ?? [];
  let _executed: AsyncResult<T, E> | null = null;

  const execute = (): AsyncResult<T, E> => {
    if (_executed) {
      return _executed;
    }

    if (_ops.length === 0) {
      _executed = promise;
    } else {
      _executed = promise.then(async (r) => {
        let current: Result<unknown, unknown> = r;
        for (const op of _ops) {
          current = await op(current);
        }
        return current as Result<T, E>;
      });
    }

    return _executed;
  };

  const builder: AsyncResultBuilder<T, E> = {
    get result() {
      return execute();
    },
    get isOk() {
      return execute().then(isOk);
    },
    get isErr() {
      return execute().then(isErr);
    },
    map: <R>(fn: (value: T) => R) => {
      const op: Op = (r: Result<unknown, unknown>) => mapOp(r as Result<T, E>, fn);

      return createAsyncResultBuilder<R, E>(promise as unknown as AsyncResult<R, E>, [..._ops, op]);
    },
    mapErr: <F>(fn: (error: E) => F) => {
      const op: Op = (r: Result<unknown, unknown>) => mapErr(r as Result<T, E>, fn);

      return createAsyncResultBuilder<T, F>(promise as unknown as AsyncResult<T, F>, [..._ops, op]);
    },
    andThen: <R>(fn: (value: T) => Result<R, E> | AsyncResult<R, E>) => {
      const op: Op = (r: Result<unknown, unknown>) => {
        const res = r as Result<T, E>;

        if (!res.ok) {
          return res;
        }

        return fn(res.value);
      };

      return createAsyncResultBuilder<R, E>(promise as unknown as AsyncResult<R, E>, [..._ops, op]);
    },
    orElse: <F>(fn: (error: E) => Result<T, F> | AsyncResult<T, F>) => {
      const op: Op = (r: Result<unknown, unknown>) => {
        const res = r as Result<T, E>;

        if (res.ok) {
          return res;
        }

        return fn(res.error);
      };

      return createAsyncResultBuilder<T, F>(promise as unknown as AsyncResult<T, F>, [..._ops, op]);
    },
    tap: (fn: (value: T) => void) => {
      const op: Op = (r: Result<unknown, unknown>) => tapOp(r as Result<T, E>, fn);

      return createAsyncResultBuilder<T, E>(promise, [..._ops, op]);
    },
    tapErr: (fn: (error: E) => void) => {
      const op: Op = (r: Result<unknown, unknown>) => tapErrOp(r as Result<T, E>, fn);

      return createAsyncResultBuilder<T, E>(promise, [..._ops, op]);
    },
    context: <C extends Record<string, unknown>>(message: string, help?: string, meta?: C) => {
      const op: Op = (r: Result<unknown, unknown>) =>
        contextOp(r as Result<T, E>, message, help, meta);

      return createAsyncResultBuilder<T, Report<C>>(
        promise as unknown as AsyncResult<T, Report<C>>,
        [..._ops, op],
      );
    },
    note: (msg: string) => {
      const op: Op = (r: Result<unknown, unknown>) => noteOp(r as Result<T, E>, msg);

      return createAsyncResultBuilder<T, Report>(promise as unknown as AsyncResult<T, Report>, [
        ..._ops,
        op,
      ]);
    },
    match: <R>(handlers: { ok: (value: T) => R; err: (error: E) => R }) =>
      execute().then((r) => match(r, handlers)) as Promise<R>,
    unwrapOr: (defaultValue: T) => execute().then((r) => unwrapOr(r, defaultValue)),
    unwrap: () => execute().then((r) => unwrap(r)),
  };

  return builder;
}

/**
 * Namespace object providing convenient static constructors for `AsyncResultBuilder`.
 *
 * Use these to start an async fluent chain without manually wrapping values:
 *
 * ```ts
 * await AsyncResultBuilder.ok(42).map(n => n + 1).unwrap()    // 43
 * await AsyncResultBuilder.safeAsync(fetch("/api/user"))
 *   .andThen(res => res.json())
 *   .unwrap()
 * ```
 *
 * Under the hood each method wraps the value in a resolved `Promise<Result>`
 * and delegates to {@link createAsyncResultBuilder}.
 *
 * @category Builder
 */
export const AsyncResultBuilder = {
  /**
   * Creates an `AsyncResultBuilder` wrapping a resolved `Ok` result.
   *
   * @param args The success value. Omitted when `U` is `void`.
   * @returns An async builder wrapping a resolved `Ok(value)`.
   * @example await AsyncResultBuilder.ok("done").unwrap() // "done"
   */
  ok: <U = void, F = never>(...args: undefined extends U ? [U?] : [U]): AsyncResultBuilder<U, F> =>
    createAsyncResultBuilder<U, F>(
      Promise.resolve(Ok<U, F>(...(args as [U]))) as AsyncResult<U, F>,
    ),

  /**
   * Creates an `AsyncResultBuilder` wrapping a resolved `Err` result.
   *
   * @param error The error value.
   * @returns An async builder wrapping a resolved `Err(error)`.
   * @example await AsyncResultBuilder.err("fail").unwrapOr("default")
   */
  err: <U = never, F = unknown>(error: F): AsyncResultBuilder<U, F> =>
    createAsyncResultBuilder<U, F>(Promise.resolve(Err<U, F>(error)) as AsyncResult<U, F>),

  /**
   * Creates an `AsyncResultBuilder` from a `Promise` via {@link safeAsync}.
   *
   * @param promise The promise to await and wrap.
   * @returns An async builder wrapping the result of `safeAsync(promise)`.
   * @example await AsyncResultBuilder.safeAsync(fetch("/api/user"))
   */
  safeAsync: <U>(promise: Promise<U>): AsyncResultBuilder<U, Error> =>
    createAsyncResultBuilder(safeAsync(promise) as AsyncResult<U, Error>),

  /**
   * Combines multiple async Results into a single async builder.
   *
   * Awaits all async results in parallel. Returns `Ok` with an array of success
   * values, or the first `Err` encountered.
   *
   * @param results A variadic tuple of async Results.
   * @returns An async builder wrapping the combined result.
   * @example await AsyncResultBuilder.all([safeAsync(fetch("/a")), safeAsync(fetch("/b"))])
   */
  all: <V extends readonly AsyncResult<unknown, unknown>[]>(
    results: [...V],
  ): AsyncResultBuilder<
    { [K in keyof V]: V[K] extends AsyncResult<infer Val, unknown> ? Val : never },
    V[number] extends AsyncResult<unknown, infer ErrV> ? ErrV : never
  > =>
    createAsyncResultBuilder(
      Promise.all(results).then((resolved) => {
        // biome-ignore lint/suspicious/noExplicitAny: accumulator type evolves
        const values: any[] = [];

        for (const res of resolved) {
          if (!res.ok) {
            return Err(res.error) as never;
          }

          values.push(res.value);
        }

        return Ok(values) as never;
        // biome-ignore lint/suspicious/noExplicitAny: needed for complex generic inference
      }) as AsyncResult<any, any>,
      // biome-ignore lint/suspicious/noExplicitAny: needed for complex generic inference
    ) as any,

  /**
   * Returns the first `Ok` async Result from an array.
   *
   * Awaits all async results in parallel. If none succeeded, returns the last
   * error. Throws on an empty array.
   *
   * @param results An array of async Results to check.
   * @returns An async builder wrapping the first Ok or last Err.
   * @example await AsyncResultBuilder.any([safeAsync(fetch("/a")), safeAsync(fetch("/b"))])
   */
  any: <U, F>(results: AsyncResult<U, F>[]): AsyncResultBuilder<U, F> => {
    if (results.length === 0) {
      return createAsyncResultBuilder(
        Promise.resolve(Err(new Error("any() called with an empty array") as unknown as F)),
      );
    }

    return createAsyncResultBuilder(
      Promise.all(results).then((resolved) => {
        let lastErr: F | undefined;

        for (const res of resolved) {
          if (res.ok) {
            return res as Result<U, F>;
          }

          lastErr = res.error;
        }

        return Err(lastErr as F);
      }) as AsyncResult<U, F>,
    );
  },
};

/**
 * Wraps an `AsyncResult` (`Promise<Result<T, E>>`) in an `AsyncResultBuilder` for fluent chaining.
 *
 * @param promise The async result promise to wrap.
 * @returns An `AsyncResultBuilder` instance.
 *
 * @category Builder
 * @example
 * const value = await buildAsync(safeAsync(fetch("/api/user")))
 *   .andThen(res => res.json())
 *   .unwrapOr(null);
 */
export function buildAsync<T, E>(promise: AsyncResult<T, E>): AsyncResultBuilder<T, E> {
  return createAsyncResultBuilder(promise);
}
