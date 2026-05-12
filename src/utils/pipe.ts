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
export async function pipe<T>(value: T | Promise<T>): Promise<Awaited<T>>;
export async function pipe<T, F1>(value: T | Promise<T>, f1: (arg: T) => F1): Promise<Awaited<F1>>;
export async function pipe<T, F1, F2>(
  value: T | Promise<T>,
  f1: (arg: T) => F1,
  f2: (arg: Awaited<F1>) => F2,
): Promise<Awaited<F2>>;
export async function pipe<T, F1, F2, F3>(
  value: T | Promise<T>,
  f1: (arg: T) => F1,
  f2: (arg: Awaited<F1>) => F2,
  f3: (arg: Awaited<F2>) => F3,
): Promise<Awaited<F3>>;
// biome-ignore lint/complexity/useMaxParams: pipe naturally has many parameters for overloads
export async function pipe<T, F1, F2, F3, F4>(
  value: T | Promise<T>,
  f1: (arg: T) => F1,
  f2: (arg: Awaited<F1>) => F2,
  f3: (arg: Awaited<F2>) => F3,
  f4: (arg: Awaited<F3>) => F4,
): Promise<Awaited<F4>>;
// biome-ignore lint/complexity/useMaxParams: pipe naturally has many parameters for overloads
export async function pipe<T, F1, F2, F3, F4, F5>(
  value: T | Promise<T>,
  f1: (arg: T) => F1,
  f2: (arg: Awaited<F1>) => F2,
  f3: (arg: Awaited<F2>) => F3,
  f4: (arg: Awaited<F3>) => F4,
  f5: (arg: Awaited<F4>) => F5,
): Promise<Awaited<F5>>;
// biome-ignore lint/suspicious/noExplicitAny: internal implementation requires any
export async function pipe<T, Fns extends any[]>(value: T | Promise<T>, ...fns: Fns): Promise<any> {
  // biome-ignore lint/suspicious/noExplicitAny: internal accumulator requires any
  let acc: any = await value;

  for (const fn of fns) {
    acc = await fn(acc);
  }

  return acc;
}
