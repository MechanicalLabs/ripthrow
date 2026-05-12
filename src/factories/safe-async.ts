import type { Result } from "../types";
import { Err } from "./err";
import { Ok } from "./ok";

/**
 * Converts a Promise into a Result.
 * If the promise resolves, it returns an Ok result with the data.
 * If the promise rejects, it captures the reason and returns an Err result.
 *
 * @template T The type of the success value.
 * @template E The type of the error value. Defaults to Error.
 * @param promise The Promise to convert.
 * @returns A Promise resolving to an Ok result with the data, or an Err result with the error.
 *
 * @category Factories
 * @see safe
 * @example
 * const res = await safeAsync(fetch("https://api.example.com"));
 * if (res.ok) console.log(await res.value.json());
 */
export async function safeAsync<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;

    return Ok<T, E>(data as T);
  } catch (e) {
    return Err(e as E);
  }
}
