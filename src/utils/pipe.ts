/**
 * Pipes a value through a series of transform functions.
 * Accepts both sync and Promise values — awaits the input if needed.
 *
 * @category Utilities
 * @example
 * const result = await pipe(
 *   safe(() => JSON.parse(input)),
 *   (r) => map(r, (data: any) => data.a),
 *   (r) => unwrapOr(r, 0),
 * );
 */
// biome-ignore lint/suspicious/noExplicitAny: variadic pipe needs flexibility
export async function pipe<T, Fns extends Array<(arg: any) => any>>(
  value: T | Promise<T>,
  ...fns: Fns
  // biome-ignore lint/suspicious/noExplicitAny: conditional type inference
): Promise<Fns extends [...any[], infer Last] ? (Last extends (arg: any) => infer R ? R : T) : T> {
  let acc: unknown = await value;
  for (const fn of fns) {
    // biome-ignore lint/suspicious/noExplicitAny: variadic pipe
    acc = (fn as any)(acc);
  }
  return acc as never;
}
