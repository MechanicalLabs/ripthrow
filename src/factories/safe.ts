import type { Result } from "../types";
import { Err } from "./err";
import { Ok } from "./ok";

/**
 * Executes a synchronous function and wraps its return value in an Ok result.
 * If the function throws an error, it captures it and wraps it in an Err result.
 *
 * @template T The type of the success value.
 * @template E The type of the error value. Defaults to Error.
 * @param fn The function to execute.
 * @returns An Ok result with the return value, or an Err result with the thrown error.
 *
 * @category Factories
 * @see safeAsync
 * @example
 * const res = safe(() => JSON.parse('{"valid": true}'));
 * if (res.ok) console.log(res.value);
 */
export function safe<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return Ok<T, E>(fn());
  } catch (e) {
    return Err(e as E);
  }
}
