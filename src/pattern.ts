// biome-ignore-all lint/nursery/useConsistentMethodSignatures: overloaded signatures on MatchErrBuilder interface
import type { Result } from "./types";

const $class = Symbol("error-class");
const $errorTag = Symbol("error-tag");
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

/**
 * A callable factory wrapping an external Error class for use with
 * {@link matchErr}. Created via {@link wrapError}.
 *
 * @template C The external Error class type.
 * @category Error Handling
 */
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

// biome-ignore lint/suspicious/noExplicitAny: needed to match any metadata type
type TypedKinds<E> = E extends TypedError<unknown[], infer K, any> ? K : never;

/**
 * Computes which error kinds have NOT been handled yet.
 * Used in type-level exhaustive checking for .exhaustive().
 */
type UnhandledKinds<E, Handled extends string> = Exclude<TypedKinds<E>, Handled>;

/**
 * Branded type that surfaces the MISSING error handler name(s) in
 * TypeScript compiler errors when .exhaustive() is called with unhandled cases.
 *
 * This is a type-level indicator only - it has no runtime representation.
 * When you see `MissingHandler<"DbError">` in a type error, it means you
 * need to add `.on(Errors.DbError, ...)` to your matchErr chain.
 */
interface MissingHandler<in out K extends string> {
  readonly __missingHandler: K;
}

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
 * Each key becomes a named {@link ErrFactory} callable with the args inferred
 * from the `message` function. The returned object also carries a `_type`
 * discriminant — a union of all defined error types — useful for exhaustive
 * type narrowing and for annotating `Result<E, AppError>`.
 *
 * Inspired by Rust's `thiserror` / `derive(Error)` pattern.
 *
 * @param defs An object mapping error names to `{ message, help?, _metadata? }`.
 * @returns An object with one factory per key and a combined `_type` union.
 *
 * @template T The shape of the definition map.
 *
 * @category Error Handling
 * @see createError
 * @see matchErr
 * @example
 * const Errors = createErrors({
 *   NotFound: { message: (id: string) => `User "${id}" not found` },
 *   DbError:  { message: (code: number) => `Database error ${code}` },
 * });
 *
 * type AppError = typeof Errors._type;
 * // AppError = TypedError<[string], "NotFound"> | TypedError<[number], "DbError">
 *
 * const err = Errors.NotFound("42");
 * err.kind // "NotFound"
 */
export function createErrors<T extends ErrDefMap>(defs: T): ErrorFactories<T> {
  // biome-ignore lint/suspicious/noExplicitAny: internal storage of factories
  const factories: Record<string, ErrFactory<unknown[], string, any>> = {};

  for (const [name, definition] of Object.entries(defs)) {
    factories[name] = createError(name, definition.message, definition.help, definition._metadata);
  }

  return factories as unknown as ErrorFactories<T>;
}

/**
 * Creates a single typed error factory.
 *
 * Returns a callable function that produces `TypedError` objects with a
 * discriminable `.kind` field, optional help text, and arbitrary metadata.
 * The returned factory also acts as a matcher for {@link matchErr}.
 *
 * @param name The literal error name (used as `.kind` and `err.name`).
 * @param message A message template receiving the same args as the factory.
 * @param help An optional help template for user-facing guidance.
 * @param _metadata Optional static metadata attached to every produced error.
 * @returns An {@link ErrFactory} that creates typed errors and can be passed
 *          to {@link matchErr} `.on()` for instanceof-style matching.
 *
 * @template A The type of the arguments tuple.
 * @template N The literal string type of the error name.
 * @template M The type of the static metadata.
 *
 * @category Error Handling
 * @see createErrors
 * @see matchErr
 * @example
 * const NotFound = createError(
 *   "NotFound",
 *   (id: string) => `User "${id}" not found`,
 *   (id: string) => `Check user ID "${id}"`,
 * );
 *
 * const err = NotFound("42");
 * err.kind   // "NotFound"
 * err.args   // ["42"]
 * err.help   // "Check user ID \"42\""
 */
export function createError<A extends unknown[], N extends string, M = Record<string, unknown>>(
  name: N,
  message: (...args: A) => string,
  help?: (...args: A) => string,
  _metadata?: M,
): ErrFactory<A, N, M> {
  const tag = Symbol(name);

  const factory = (...args: A): TypedError<A, N, M> => {
    const err = new Error(message(...args));
    err.name = name;

    const typedErr = err as unknown as TypedError<A, N, M>;

    // biome-ignore lint/suspicious/noExplicitAny: readonly properties on TypedError
    const mutableErr = typedErr as any;

    mutableErr.args = args;
    mutableErr.kind = name;
    mutableErr._metadata = _metadata;

    Object.defineProperty(typedErr, $errorTag, { value: tag });

    if (help) {
      mutableErr.help = help(...args);
    }

    return typedErr;
  };

  Object.defineProperty(factory, $class, { value: tag });

  return factory as unknown as ErrFactory<A, N, M>;
}

/**
 * Wraps an external Error class so it can be matched with {@link matchErr}.
 *
 * The returned factory creates instances of the original class, and the
 * `.on()` handler in `matchErr` uses `instanceof` under the hood, so you get
 * full access to the original class's typed properties.
 *
 * @param cls The external Error class to wrap (e.g. `PrismaClientKnownRequestError`).
 * @returns An {@link ExternalErrFactory} callable as a constructor and usable
 *          in {@link matchErr} `.on()`.
 *
 * @category Error Handling
 * @example
 * import { PrismaClientKnownRequestError } from "@prisma/client";
 * const PrismaErr = wrapError(PrismaClientKnownRequestError);
 *
 * matchErr(result)
 *   .on(PrismaErr, (e) => `Prisma error ${e.code}`)
 *   .otherwise((e) => `Other: ${e.message}`);
 */
export function wrapError<C extends new (...args: never[]) => Error>(
  cls: C,
): ExternalErrFactory<C> {
  const factory = (...args: ConstructorParameters<C>): Error => new cls(...args);

  Object.defineProperty(factory, $class, { value: cls });

  return factory as unknown as ExternalErrFactory<C>;
}

/**
 * Fluent builder for pattern matching on a Result's error.
 *
 * Start with {@link matchErr}, then chain `.on()` calls for each error variant
 * you want to handle, and finish with `.otherwise()` or `.exhaustive()`.
 *
 * @template T The success type of the Result being matched.
 * @template E The error type of the Result being matched.
 * @template R The accumulated return type of all `.on()` handlers.
 * @template Handled The union of error kinds already handled (tracked at type level).
 *
 * @category Error Handling
 */
export interface MatchErrBuilder<T, E, R, Handled extends string = never> {
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

  /**
   * Finalizes the match with a fallback for unhandled errors.
   */
  otherwise: (fallback: (err: E) => R) => T | R;

  /**
   * Ensures all typed errors from a createErrors set are handled.
   *
   * If not all error kinds are handled, TypeScript will show an error
   * like `MissingHandler<"DbError">` indicating exactly which handler is missing.
   */
  exhaustive: () => [UnhandledKinds<E, Handled>] extends [never]
    ? T | R
    : MissingHandler<UnhandledKinds<E, Handled>>;
}

/**
 * Starts a fluent pattern match on a Result's error.
 *
 * Chain `.on()` calls for each error variant you want to handle, then finish
 * with `.otherwise(fallback)` for a catch-all or `.exhaustive()` when every
 * possible typed error kind has a handler.
 *
 * When the Result is `Ok`, the match short-circuits and returns the success
 * value directly — no handler is invoked.
 *
 * @param result The Result whose error to match against.
 * @returns A {@link MatchErrBuilder} to chain `.on()` calls.
 *
 * @category Error Handling
 * @example
 * matchErr(getUser("123"))
 *   .on(NotFound, (e) => `Missing user ${e.args[0]}`)
 *   .on(DbError,  (e) => `DB error code ${e.args[0]}`)
 *   .exhaustive();
 */
export function matchErr<T, E>(result: Result<T, E>): MatchErrBuilder<T, E, never, never> {
  const handlers: HandlerEntry[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: internal generic handling
  const execute = (fallback: (err: E) => any): any => {
    if (result.ok) {
      return result.value;
    }

    // biome-ignore lint/nursery/useDestructuring: discriminated union prevents destructuring
    const error = result.error;

    for (const entry of handlers) {
      const handlerResult = entry.execute(error);
      if (handlerResult !== noMatch) {
        return handlerResult;
      }
    }

    return fallback(error);
  };

  // biome-ignore lint/suspicious/noExplicitAny: internal builder with complex generics
  const builder: any = {
    on: (errorFactory: unknown, handler: unknown) => {
      const tagOrClass = (errorFactory as { readonly [$class]: unknown })[$class];

      handlers.push({
        execute: (err: unknown) => {
          if (typeof tagOrClass === "function") {
            if ((err as Error) instanceof (tagOrClass as new (...args: never[]) => Error)) {
              return (handler as (err: unknown) => unknown)(err);
            }
          } else if ((err as Record<symbol, unknown>)?.[$errorTag] === tagOrClass) {
            return (handler as (err: unknown) => unknown)(err);
          }
          return noMatch;
        },
      });
      return builder;
    },
    // biome-ignore lint/suspicious/noExplicitAny: internal generic executor
    otherwise: (fallback: (err: E) => any) => execute(fallback),
    exhaustive: () =>
      execute((err: E) => {
        throw err;
      }) as never,
  };

  return builder as MatchErrBuilder<T, E, never, never>;
}

/**
 * A callable factory that creates typed errors and can participate in
 * {@link matchErr} pattern matching.
 *
 * Create one via {@link createError} or `createErrors()[key]`.
 *
 * @template A The type of the arguments tuple passed to the factory.
 * @template N The literal string type of the error name (`.kind` / `.name`).
 * @template M The type of the static metadata attached to each error.
 *
 * @category Error Handling
 */
export interface ErrFactory<A extends unknown[], N extends string, M = Record<string, unknown>> {
  (...args: A): TypedError<A, N, M>;
  readonly [$class]: symbol;
}
