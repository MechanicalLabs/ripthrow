import { Bench, type Task } from "tinybench";
import {
  Ok,
  Err,
  safe,
  safeAsync,
  match,
  matchErr,
  map,
  mapErr,
  andThen,
  orElse,
  context,
  all,
  any,
  build,
  createError,
} from "../src";

const BENCH_DURATION = 200;
const SAMPLE_VALUE = 42;
const MAP_ITERATIONS = 5;

const NotFound = createError("NotFound", (id: string) => `User "${id}" not found`);

function tryCatchReturn<U>(fn: () => U): { ok: true; value: U } | { ok: false; error: unknown } {
  try {
    return { ok: true as const, value: fn() };
  } catch (e) {
    return { ok: false as const, error: e };
  }
}

async function tryCatchAsync<U>(
  promise: Promise<U>,
): Promise<{ ok: true; value: U } | { ok: false; error: unknown }> {
  try {
    return { ok: true as const, value: await promise };
  } catch (e) {
    return { ok: false as const, error: e };
  }
}

function legacyThrow<T>(val: T): T {
  if (val === 0) {
    throw new Error("zero");
  }
  return val;
}

const testData = JSON.parse('{"a":{"b":{"c":[1,2,3]}}}') as { a: { b: { c: number[] } } };

const bench = new Bench({ time: BENCH_DURATION });

bench
  .add("Ok()", () => Ok(SAMPLE_VALUE))
  .add("throw", () => {
    try {
      throw new Error("fail");
    } catch {
      /* noop */
    }
  })
  .add("Err()", () => Err("fail"))
  .add("{ ok: true } manual", () => ({ ok: true as const, value: SAMPLE_VALUE }))

  .add("safe(success)", () => safe(() => SAMPLE_VALUE))
  .add("tryCatchReturn(success)", () => tryCatchReturn(() => SAMPLE_VALUE))

  .add("safe(throws)", () => safe(() => JSON.parse("invalid")))
  .add("tryCatchReturn(throws)", () => tryCatchReturn(() => JSON.parse("invalid")))

  .add("safeAsync(success)", async () => safeAsync(Promise.resolve(SAMPLE_VALUE)))
  .add("tryCatchAsync(success)", async () => tryCatchAsync(Promise.resolve(SAMPLE_VALUE)))

  .add("map x5 (ripthrow)", () => {
    let r = Ok(1) as ReturnType<typeof Ok<number, never>>;
    for (let i = 0; i < MAP_ITERATIONS; i++) {
      r = map(r, (n: number) => n + 1);
    }
    return r;
  })
  .add("if/else x5 (native)", () => {
    let r: { ok: true; value: number } | { ok: false; error: unknown } = {
      ok: true as const,
      value: 1,
    };
    for (let i = 0; i < MAP_ITERATIONS; i++) {
      if (r.ok) {
        r = { ok: true as const, value: r.value + 1 };
      }
    }
    return r;
  })

  .add("match(Ok)", () => match(Ok(SAMPLE_VALUE), { ok: (v: number) => v, err: () => 0 }))
  .add("match(Err)", () =>
    match(Err<number, string>("fail"), { ok: (v: number) => v, err: () => 0 }),
  )
  .add("try/catch (no throw)", () => {
    try {
      return SAMPLE_VALUE;
    } catch {
      return 0;
    }
  })
  .add("try/catch (throw)", () => {
    try {
      throw new Error("fail");
    } catch {
      return 0;
    }
  })

  .add("andThen chain (ripthrow)", () =>
    andThen(
      map(Ok(10), (n: number) => n * 2),
      (n: number) => Ok(n.toString()),
    ),
  )
  .add("andThen+mapErr (ripthrow)", () =>
    mapErr(
      andThen(Ok<number, string>(10), (n: number) => Ok(n * 2)),
      (e: string) => `err: ${e}`,
    ),
  )
  .add("orElse fallback", () => orElse(Err("fail"), (e: string) => Ok(`recovered from ${e}`)))

  .add("builder chain 5 ops", () =>
    build(Ok(1))
      .map((n: number) => n + 1)
      .andThen((n: number) => Ok(n * 2))
      .mapErr(String)
      .unwrapOr(0),
  )
  .add("builder with tap", () =>
    build(Ok("hello"))
      .tap(() => {
        /* noop */
      })
      .map((s: string) => s.length)
      .unwrapOr(0),
  )

  .add("context() wrap", () => context(Err("fail"), "wrapped"))
  .add("context() with help", () => context(Err("fail"), "wrapped", "try again"))

  .add("all(5 ok)", () => all([Ok(1), Ok(2), Ok(3), Ok(4), Ok(SAMPLE_VALUE)]))
  .add("all(5, last err)", () => all([Ok(1), Ok(2), Err("x"), Ok(4), Ok(SAMPLE_VALUE)]))
  .add("any(5 ok)", () => any([Ok(1), Ok(2), Ok(3), Ok(4), Ok(SAMPLE_VALUE)]))
  .add("any(5, first ok)", () => any([Err("x"), Err("y"), Ok(3), Ok(4), Ok(SAMPLE_VALUE)]))

  .add("matchErr (hit)", () =>
    matchErr(Err(NotFound("alice")))
      .on(NotFound, (e) => e.args[0])
      .otherwise(() => "fallback"),
  )
  .add("matchErr (miss)", () =>
    matchErr(Err("generic"))
      .on(NotFound, (e) => e.args[0])
      .otherwise(() => "fallback"),
  )

  .add("real: parse JSON (ripthrow)", () =>
    build(safe(() => JSON.parse('{"valid": true}') as { valid: boolean }))
      .map((d: { valid: boolean }) => d.valid)
      .unwrapOr(false),
  )
  .add("real: parse JSON (try/catch)", () => {
    try {
      const d = JSON.parse('{"valid": true}') as { valid: boolean };
      return d.valid ?? false;
    } catch {
      return false;
    }
  })

  .add("real: deep access (ripthrow)", () =>
    build(
      safe(() => {
        const {
          a: {
            b: { c },
          },
        } = testData;
        return c;
      }),
    )
      .andThen((arr: number[]) => Ok(arr[1] as number))
      .unwrapOr(-1),
  )
  .add("real: deep access (try/catch)", () => {
    try {
      const {
        a: {
          b: { c },
        },
      } = testData;
      return c[1] as number;
    } catch {
      return -1;
    }
  })
  .add("real: legacy throw (ripthrow)", () =>
    andThen(
      safe(() => legacyThrow(1)),
      (v: number) => Ok(v * 2),
    ),
  )
  .add("real: legacy throw (try/catch)", () => {
    try {
      return legacyThrow(1) * 2;
    } catch {
      return -1;
    }
  });

await bench.run();

const maxNameLen = Math.max(...bench.tasks.map((t: Task) => t.name.length));

console.log(
  `\n  ${"Benchmark".padEnd(maxNameLen)}  ${"ops/s".padStart(14)}  ${"latency".padStart(10)}  ${"samples".padStart(8)}`,
);
console.log(`  ${"─".repeat(maxNameLen + 40)}`);
for (const t of bench.tasks) {
  const r = t.result;
  if (r && r.state === "completed") {
    const ops = Math.round(r.throughput.mean).toLocaleString().padStart(14);
    const ns = (r.latency.mean * 1_000_000).toFixed(1).padStart(6);
    const n = r.latency.samplesCount.toLocaleString().padStart(8);
    console.log(`  ${t.name.padEnd(maxNameLen)}  ${ops}  ${ns} ns  ${n}`);
  }
}
