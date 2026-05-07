import type { Result } from "../types";
import { Err } from "./err";
import { Ok } from "./ok";

/**
 * Converts a Promise into a Result.
 * Captures any rejection or thrown error.
 * @param promise The Promise to convert.
 * @returns A Promise resolving to an Ok result with the data, or an Err result with the error.
 */
export async function safeAsync<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return Ok(data);
  } catch (e) {
    return Err(e as E);
  }
}
