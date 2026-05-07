import type { Result } from "../types";
import { Err } from "./err";
import { Ok } from "./ok";

/**
 * Executes a synchronous function and wraps the result in a Result.
 * Captures any thrown errors.
 * @param fn The function to execute.
 * @returns An Ok result with the return value, or an Err result with the thrown error.
 */
export function safe<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(e as E);
  }
}
