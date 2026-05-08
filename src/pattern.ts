// biome-ignore lint/nursery/noExcessiveClassesPerFile: _Error is local inside createError
import type { Result } from "./types/result";

const $class = Symbol("error-class");
const noMatch = Symbol("no-match");

interface TypedError<A extends unknown[], N extends string> extends Error {
  readonly args: A;
  readonly help?: string;
  readonly name: N;
  readonly kind: N;
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
}

type ErrDefMap = Record<string, ErrDefEntry>;

declare const exhaustiveCheck: unique symbol;
type TypedKinds<E> = E extends TypedError<unknown[], infer K> ? K : never;
type AllTypedKindsHandled<E, Handled extends string> = TypedKinds<E> extends Handled ? true : false;

type ErrorFactories<T extends ErrDefMap> = {
  [K in keyof T & string]: ErrFactory<Parameters<T[K]["message"]>, K>;
} & {
  readonly _type: {
    [K in keyof T & string]: TypedError<Parameters<T[K]["message"]>, K>;
  }[keyof T & string];
};

export function createErrors<T extends ErrDefMap>(defs: T): ErrorFactories<T> {
  const result: Record<string, ErrFactory<unknown[], string>> = {};
  for (const [name, def] of Object.entries(defs)) {
    result[name] = createError(name, def.message, def.help);
  }
  return result as unknown as ErrorFactories<T>;
}

export function createError<A extends unknown[], N extends string>(
  name: N,
  message: (...args: A) => string,
  help?: (...args: A) => string,
): ErrFactory<A, N> {
  class _Error extends Error {
    override readonly name: N;
    readonly args: A;
    readonly help: string | undefined;
    readonly kind: N = name;

    constructor(...args: A) {
      super(message(...args));
      this.name = name;
      this.args = args;
      if (help) {
        this.help = help(...args);
      }
    }
  }
  Object.defineProperty(_Error, "name", { value: name });

  const factory = (...args: A): TypedError<A, N> =>
    new _Error(...args) as unknown as TypedError<A, N>;
  Object.defineProperty(factory, $class, { value: _Error });
  return factory as unknown as ErrFactory<A, N>;
}

export function wrapError<C extends new (...args: never[]) => Error>(
  cls: C,
): ExternalErrFactory<C> {
  const factory = (...args: ConstructorParameters<C>): Error => new cls(...args);
  Object.defineProperty(factory, $class, { value: cls });
  return factory as unknown as ExternalErrFactory<C>;
}

export class MatchErrBuilder<T, E, R, Handled extends string = never> {
  private readonly result: Result<T, E>;
  private readonly handlers: HandlerEntry[] = [];

  constructor(result: Result<T, E>) {
    this.result = result;
  }

  on<A extends unknown[], N extends string, HandlerResult>(
    def: ErrFactory<A, N>,
    handler: (err: TypedError<A, N>) => HandlerResult,
  ): MatchErrBuilder<T, E, R | HandlerResult, Handled | N>;

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

  otherwise(fallback: (err: E) => R): T | R {
    return this.execute(fallback);
  }

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

export function matchErr<T, E>(result: Result<T, E>): MatchErrBuilder<T, E, never, never> {
  return new MatchErrBuilder(result);
}

export interface ErrFactory<A extends unknown[], N extends string> {
  (...args: A): TypedError<A, N>;
  readonly [$class]: new (...args: A) => TypedError<A, N>;
}
