import { match } from "./consumers/match";
import { unwrap } from "./consumers/unwrap";
import { unwrapOr } from "./consumers/unwrap-or";
import { Err } from "./factories/err";
import { isErr } from "./factories/is-err";
import { isOk } from "./factories/is-ok";
import { Ok } from "./factories/ok";
import { safeAsync } from "./factories/safe-async";
import { context as contextOp } from "./operators/context";
import { map } from "./operators/map";
import { mapErr } from "./operators/map-err";
import { tap } from "./operators/tap";
import { tapErr } from "./operators/tap-err";
import type { Report } from "./report";
import type { AsyncResult, Result } from "./types/result";

export class AsyncResultBuilder<T, E> {
  private readonly _promise: AsyncResult<T, E>;

  constructor(promise: AsyncResult<T, E>) {
    this._promise = promise;
  }

  static ok<U = void, F = unknown>(value?: U): AsyncResultBuilder<U, F> {
    return new AsyncResultBuilder(Promise.resolve(Ok(value) as Result<U, F>));
  }

  static err<U, F>(error: F): AsyncResultBuilder<U, F> {
    return new AsyncResultBuilder(Promise.resolve(Err(error) as Result<U, F>));
  }

  static safeAsync<U, F = Error>(promise: Promise<U>): AsyncResultBuilder<U, F> {
    return new AsyncResultBuilder(safeAsync(promise) as AsyncResult<U, F>);
  }

  static all<U, F>(results: AsyncResult<U, F>[]): AsyncResultBuilder<U[], F> {
    return new AsyncResultBuilder(
      Promise.all(results).then((resolved) => {
        const values: U[] = [];
        for (const res of resolved) {
          if (!res.ok) {
            return Err(res.error);
          }
          values.push(res.value);
        }
        return Ok(values);
      }),
    );
  }

  static any<U, F>(results: AsyncResult<U, F>[]): AsyncResultBuilder<U, F> {
    if (results.length === 0) {
      return new AsyncResultBuilder(
        Promise.resolve(Err(new Error("any() called with an empty array") as unknown as F)),
      );
    }

    return new AsyncResultBuilder(
      Promise.all(results).then((resolved) => {
        let lastErr: F | undefined;
        for (const res of resolved) {
          if (res.ok) {
            return res;
          }
          lastErr = res.error;
        }
        return Err(lastErr as F);
      }),
    );
  }

  get result(): AsyncResult<T, E> {
    return this._promise;
  }

  get isOk(): Promise<boolean> {
    return this._promise.then(isOk);
  }

  get isErr(): Promise<boolean> {
    return this._promise.then(isErr);
  }

  map<R>(fn: (value: T) => R): AsyncResultBuilder<R, E> {
    return new AsyncResultBuilder(this._promise.then((r) => map(r, fn)));
  }

  mapErr<F>(fn: (error: E) => F): AsyncResultBuilder<T, F> {
    return new AsyncResultBuilder(this._promise.then((r) => mapErr(r, fn)));
  }

  andThen<R>(fn: (value: T) => Result<R, E> | AsyncResult<R, E>): AsyncResultBuilder<R, E> {
    return new AsyncResultBuilder(
      this._promise.then((r) => {
        if (!r.ok) {
          return r;
        }
        return fn(r.value);
      }),
    );
  }

  orElse<F>(fn: (error: E) => Result<T, F> | AsyncResult<T, F>): AsyncResultBuilder<T, F> {
    return new AsyncResultBuilder(
      this._promise.then((r) => {
        if (r.ok) {
          return r;
        }
        return fn(r.error);
      }),
    );
  }

  tap(fn: (value: T) => void): AsyncResultBuilder<T, E> {
    return new AsyncResultBuilder(this._promise.then((r) => tap(r, fn)));
  }

  tapErr(fn: (error: E) => void): AsyncResultBuilder<T, E> {
    return new AsyncResultBuilder(this._promise.then((r) => tapErr(r, fn)));
  }

  context(message: string, help?: string): AsyncResultBuilder<T, Report> {
    return new AsyncResultBuilder(this._promise.then((r) => contextOp(r, message, help)));
  }

  match<R>(handlers: { ok: (value: T) => R; err: (error: E) => R }): Promise<R> {
    return this._promise.then((r) => match(r, handlers));
  }

  unwrapOr(defaultValue: T): Promise<T> {
    return this._promise.then((r) => unwrapOr(r, defaultValue));
  }

  unwrap(): Promise<T> {
    return this._promise.then((r) => unwrap(r));
  }
}

export function buildAsync<T, E>(promise: AsyncResult<T, E>): AsyncResultBuilder<T, E> {
  return new AsyncResultBuilder(promise);
}
