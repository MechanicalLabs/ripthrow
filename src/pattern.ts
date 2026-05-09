// biome-ignore lint/nursery/noExcessiveClassesPerFile: _Error is local inside createError
import type { Result } from "./types/result";

const $class = Symbol("error-class");
const noMatch = Symbol("no-match");

interface TypedError<A extends unknown[], N extends string, M = Record<string, unknown>>
  extends Error {
  readonly args: A;
  readonly help?: string;
  readonly name: N;
  readonly kind: N;
  readonly _metadata?: M;
}

interface HandlerEntry {
  execute: (err: unknown) => unknown;
}

interface ExternalErrFactory<C extends new (...args: never[]) => Error> {
  (...args: ConstructorParameters<C>): InstanceType<C>;
  readonly [$class]: C;
}

interface ErrDefEntry {
  // biome-ignore lint/suspicious/noExplicitAny: required for Parameters<>
  message: (...args: any[]) => string;
  // biome-ignore lint/suspicious/noExplicitAny: required for Parameters<>
  help?: (...args: any[]) => string;
  _metadata?: Record<string, unknown>;
}

type ErrDefMap = Record<string, ErrDefEntry>;

declare const exhaustiveCheck: unique symbol;
// biome-ignore lint/suspicious/noExplicitAny: needed to match any metadata type
type TypedKinds<E> = E extends TypedError<unknown[], infer K, any> ? K : never;
type AllTypedKindsHandled<E, Handled extends string> = TypedKinds<E> extends Handled ? true : false;

type ErrorFactories<T extends ErrDefMap> = {
  [K in keyof T & string]: ErrFactory<
    Parameters<T[K]["message"]>,
    K,
    T[K] extends { _metadata: infer M } ? M : Record<string, unknown>
  >;
} & {
  readonly _type: {
    [K in keyof T & string]: TypedError<
      Parameters<T[K]["message"]>,
      K,
      T[K] extends { _metadata: infer M } ? M : Record<string, unknown>
    >;
  }[keyof T & string];
};

/**
 * Creates a collection of error factories from a definition map.
 *
 * @template T The error definition map.
 * @param defs The definitions for each error kind.
 * @returns An object containing error factories and a combined _type.
 */
export function createErrors<T extends ErrDefMap>(defs: T): ErrorFactories<T> {
  // biome-ignore lint/suspicious/noExplicitAny: internal storage of factories
  const result: Record<string, ErrFactory<unknown[], string, any>> = {};
  for (const [name, def] of Object.entries(defs)) {
    result[name] = createError(name, def.message, def.help, def._metadata);
  }
  return result as unknown as ErrorFactories<T>;
}

/**
 * Creates a single typed error factory.
 *
 * @template A The type of the arguments.
 * @template N The literal type of the error name.
 * @template M The type of the metadata.
 */
export function createError<A extends unknown[], N extends string, M = Record<string, unknown>>(
  name: N,
  message: (...args: A) => string,
  help?: (...args: A) => string,
  _metadata?: M,
): ErrFactory<A, N, M> {
  class _Error extends Error {
    override readonly name: N;
    readonly args: A;
    readonly help: string | undefined;
    readonly kind: N = name;
    readonly _metadata: M | undefined;

    constructor(...args: A) {
      super(message(...args));
      this.name = name;
      this.args = args;
      this._metadata = _metadata;
      if (help) {
        this.help = help(...args);
      }
    }
  }
  Object.defineProperty(_Error, "name", { value: name });

  const factory = (...args: A): TypedError<A, N, M> =>
    new _Error(...args) as unknown as TypedError<A, N, M>;
  Object.defineProperty(factory, $class, { value: _Error });
  return factory as unknown as ErrFactory<A, N, M>;
}

export function wrapError<C extends new (...args: never[]) => Error>(
  cls: C,
): ExternalErrFactory<C> {
  const factory = (...args: ConstructorParameters<C>): Error => new cls(...args);
  Object.defineProperty(factory, $class, { value: cls });
  return factory as unknown as ExternalErrFactory<C>;
}

/**
 * Builder for pattern matching on results and errors.
 */
export class MatchErrBuilder<T, E, R, Handled extends string = never> {
  private readonly result: Result<T, E>;
  private readonly handlers: HandlerEntry[] = [];

  constructor(result: Result<T, E>) {
    this.result = result;
  }

  /**
   * Handles a specific error kind.
   */
  on<A extends unknown[], N extends string, M, HandlerResult>(
    def: ErrFactory<A, N, M>,
    handler: (err: TypedError<A, N, M>) => HandlerResult,
  ): MatchErrBuilder<T, E, R | HandlerResult, Handled | N>;

  /**
   * Handles an external error class.
   */
  on<C extends new (...args: never[]) => Error, HandlerResult>(
    def: ExternalErrFactory<C>,
    handler: (err: InstanceType<C>) => HandlerResult,
  ): MatchErrBuilder<T, E, R | HandlerResult, Handled>;

  on(def: unknown, handler: unknown): this {
    const _class = (def as { readonly [$class]: new (...args: never[]) => Error })[$class];
    this.handlers.push({
      execute: (err: unknown) => {
        if ((err as Error) instanceof _class) {
          return (handler as (err: unknown) => unknown)(err);
        }
        return noMatch;
      },
    });
    return this;
  }

  /**
   * Finalizes the match with a fallback for unhandled errors.
   */
  otherwise(fallback: (err: E) => R): T | R {
    return this.execute(fallback);
  }

  /**
   * Ensures all typed errors from a createErrors set are handled.
   */
  exhaustive(): AllTypedKindsHandled<E, Handled> extends true
    ? T | R
    : { readonly [exhaustiveCheck]: typeof exhaustiveCheck } {
    return this.execute((err) => {
      throw err;
    }) as never;
  }

  private execute(fallback: (err: E) => R): T | R {
    if (this.result.ok) {
      return this.result.value;
    }

    // biome-ignore lint/nursery/useDestructuring: discriminated union prevents destructuring
    const error = this.result.error;

    for (const entry of this.handlers) {
      const result = entry.execute(error);
      if (result !== noMatch) {
        return result as R;
      }
    }

    return fallback(error);
  }
}

/**
 * Starts a fluent match operation on a Result's error.
 */
export function matchErr<T, E>(result: Result<T, E>): MatchErrBuilder<T, E, never, never> {
  return new MatchErrBuilder(result);
}

/**
 * Factory function for creating typed errors.
 */
export interface ErrFactory<A extends unknown[], N extends string, M = Record<string, unknown>> {
  (...args: A): TypedError<A, N, M>;
  readonly [$class]: new (...args: A) => TypedError<A, N, M>;
}
