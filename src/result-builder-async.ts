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

type Op = (
  r: Result<unknown, unknown>,
) => Result<unknown, unknown> | Promise<Result<unknown, unknown>>;

export class AsyncResultBuilder<T, E> {
  private readonly _promise: AsyncResult<T, E>;
  private readonly _ops: Op[];
  private _executed: AsyncResult<T, E> | null = null;

  constructor(promise: AsyncResult<T, E>, ops?: Op[]) {
    this._promise = promise;
    this._ops = ops ?? [];
  }

  private execute(): AsyncResult<T, E> {
    if (this._executed) {
      return this._executed;
    }
    if (this._ops.length === 0) {
      this._executed = this._promise;
    } else {
      this._executed = this._promise.then(async (r) => {
        let current: Result<unknown, unknown> = r;
        for (const op of this._ops) {
          current = await op(current);
        }
        return current as Result<T, E>;
      });
    }
    return this._executed;
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
    return this.execute();
  }

  get isOk(): Promise<boolean> {
    return this.execute().then(isOk);
  }

  get isErr(): Promise<boolean> {
    return this.execute().then(isErr);
  }

  map<R>(fn: (value: T) => R): AsyncResultBuilder<R, E> {
    const op: Op = (r: Result<unknown, unknown>) => map(r as Result<T, E>, fn);
    return new AsyncResultBuilder<R, E>(this._promise as unknown as AsyncResult<R, E>, [
      ...this._ops,
      op,
    ]);
  }

  mapErr<F>(fn: (error: E) => F): AsyncResultBuilder<T, F> {
    const op: Op = (r: Result<unknown, unknown>) => mapErr(r as Result<T, E>, fn);
    return new AsyncResultBuilder<T, F>(this._promise as unknown as AsyncResult<T, F>, [
      ...this._ops,
      op,
    ]);
  }

  andThen<R>(fn: (value: T) => Result<R, E> | AsyncResult<R, E>): AsyncResultBuilder<R, E> {
    const op: Op = (r: Result<unknown, unknown>) => {
      const res = r as Result<T, E>;
      if (!res.ok) {
        return res;
      }
      return fn(res.value);
    };
    return new AsyncResultBuilder<R, E>(this._promise as unknown as AsyncResult<R, E>, [
      ...this._ops,
      op,
    ]);
  }

  orElse<F>(fn: (error: E) => Result<T, F> | AsyncResult<T, F>): AsyncResultBuilder<T, F> {
    const op: Op = (r: Result<unknown, unknown>) => {
      const res = r as Result<T, E>;
      if (res.ok) {
        return res;
      }
      return fn(res.error);
    };
    return new AsyncResultBuilder<T, F>(this._promise as unknown as AsyncResult<T, F>, [
      ...this._ops,
      op,
    ]);
  }

  tap(fn: (value: T) => void): AsyncResultBuilder<T, E> {
    const op: Op = (r: Result<unknown, unknown>) => tap(r as Result<T, E>, fn);
    return new AsyncResultBuilder<T, E>(this._promise, [...this._ops, op]);
  }

  tapErr(fn: (error: E) => void): AsyncResultBuilder<T, E> {
    const op: Op = (r: Result<unknown, unknown>) => tapErr(r as Result<T, E>, fn);
    return new AsyncResultBuilder<T, E>(this._promise, [...this._ops, op]);
  }

  context(
    message: string,
    help?: string,
    meta?: Record<string, unknown>,
  ): AsyncResultBuilder<T, Report> {
    const op: Op = (r: Result<unknown, unknown>) =>
      contextOp(r as Result<T, E>, message, help, meta);
    return new AsyncResultBuilder<T, Report>(this._promise as unknown as AsyncResult<T, Report>, [
      ...this._ops,
      op,
    ]);
  }

  match<R>(handlers: { ok: (value: T) => R; err: (error: E) => R }): Promise<R> {
    return this.execute().then((r) => match(r, handlers));
  }

  unwrapOr(defaultValue: T): Promise<T> {
    return this.execute().then((r) => unwrapOr(r, defaultValue));
  }

  unwrap(): Promise<T> {
    return this.execute().then((r) => unwrap(r));
  }
}

export function buildAsync<T, E>(promise: AsyncResult<T, E>): AsyncResultBuilder<T, E> {
  return new AsyncResultBuilder(promise);
}
