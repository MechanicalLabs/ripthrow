import { Err } from "../factories/err";
import { Ok } from "../factories/ok";
import type { Result } from "../types";

/**
 * Combines multiple Results into a single Result.
 * If all Results are Ok, returns an Ok with an array of all values.
 * If any Result is an Err, returns the first Err encountered.
 *
 * @template T The type of the input Results array.
 * @param results An array of Results to combine.
 * @returns A Result with an array of values or the first error.
 *
 * @category Utilities
 * @see any
 * @example
 * const res = all([Ok(1), Ok("a")]); // Result<[number, string], any>
 */
export function all<T extends readonly Result<unknown, unknown>[]>(
  results: [...T],
): Result<
  { [K in keyof T]: T[K] extends Result<infer Val, unknown> ? Val : never },
  T[number] extends Result<unknown, infer ErrV> ? ErrV : never
> {
  // biome-ignore lint/suspicious/noExplicitAny: accumulator type evolves
  const values: any[] = [];
  for (const res of results) {
    if (!res.ok) {
      // biome-ignore lint/suspicious/noExplicitAny: forced cast for complex tuple inference
      return Err(res.error) as any;
    }
    values.push(res.value);
  }
  // biome-ignore lint/suspicious/noExplicitAny: forced cast for complex tuple inference
  return Ok(values) as any;
}
