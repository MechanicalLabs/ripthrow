/**
 * A Result type representing either a success (Ok) or an error (Err).
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Represents a Result that is asynchronously resolved.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 */
export type AsyncResult<T, E> = Promise<Result<T, E>>;
