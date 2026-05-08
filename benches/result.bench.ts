import { Bench, type Task } from "tinybench";
import { match } from "../src/consumers/match";
import { Err, Ok } from "../src/factories";
import { safe } from "../src/factories/safe";
import { safeAsync } from "../src/factories/safe-async";
import { andThen } from "../src/operators/and-then";
import { context } from "../src/operators/context";
import { map } from "../src/operators/map";
import { mapErr } from "../src/operators/map-err";
import { orElse } from "../src/operators/or-else";
import { createError, matchErr } from "../src/pattern";
import { build } from "../src/result-builder";
import { all, any } from "../src/utils";

const DURATION = 200;
const SAMPLE = 42;
const N = 5;
const START = 1;
const TEN = 10;
const TWO = 2;
const THREE = 3;
const FOUR = 4;
const IDX = 1;
const ONE = 1;
const ZERO = 0;

const PAD_OPS = 14;
const PAD_NS = 10;
const PAD_SAMPLES = 8;
const LINE_EXTRA = 40;
const NS_FIXED = 1;
const NS_WIDTH = 6;
const MILLION = 1_000_000;

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

const needle = JSON.parse('{"a":{"b":{"c":[1,2,3]}}}') as { a: { b: { c: number[] } } };

const bench = new Bench({ time: DURATION });

bench
  .add("Ok()", () => Ok(SAMPLE))
  .add("throw", () => {
    try {
      throw new Error("fail");
    } catch {
      /* noop */
    }
  })
  .add("Err()", () => Err("fail"))
  .add("{ ok: true } manual", () => ({ ok: true as const, value: SAMPLE }))

  .add("safe(success)", () => safe(() => SAMPLE))
  .add("tryCatchReturn(success)", () => tryCatchReturn(() => SAMPLE))

  .add("safe(throws)", () => safe(() => JSON.parse("invalid")))
  // biome-ignore lint/security/noSecrets: benchmark label, not a secret
  .add("tryCatchReturn(throws)", () => tryCatchReturn(() => JSON.parse("invalid")))

  .add("safeAsync(success)", async () => safeAsync(Promise.resolve(SAMPLE)))
  .add("tryCatchAsync(success)", async () => tryCatchAsync(Promise.resolve(SAMPLE)))

  .add("map x5 (ripthrow)", () => {
    let r = Ok(START) as ReturnType<typeof Ok<number, never>>;
    for (let i = 0; i < N; i += 1) {
      r = map(r, (n: number) => n + ONE);
    }
    return r;
  })
  .add("if/else x5 (native)", () => {
    let r: { ok: true; value: number } | { ok: false; error: unknown } = {
      ok: true as const,
      value: ONE,
    };
    for (let i = 0; i < N; i += 1) {
      if (r.ok) {
        r = { ok: true as const, value: r.value + ONE };
      }
    }
    return r;
  })

  .add("match(Ok)", () => match(Ok(SAMPLE), { ok: (v: number) => v, err: () => ZERO }))
  .add("match(Err)", () =>
    match(Err<number, string>("fail"), { ok: (v: number) => v, err: () => ZERO }),
  )
  .add("try/catch (no throw)", () => {
    try {
      return SAMPLE;
    } catch {
      return ZERO;
    }
  })
  .add("try/catch (throw)", () => {
    try {
      throw new Error("fail");
    } catch {
      return ZERO;
    }
  })

  .add("andThen chain (ripthrow)", () =>
    andThen(
      map(Ok(TEN), (n: number) => n * TWO),
      (n: number) => Ok(n.toString()),
    ),
  )
  .add("andThen+mapErr (ripthrow)", () =>
    mapErr(
      andThen(Ok<number, string>(TEN), (n: number) => Ok(n * TWO)),
      (e: string) => `err: ${e}`,
    ),
  )
  .add("orElse fallback", () => orElse(Err("fail"), (e: string) => Ok(`recovered from ${e}`)))

  .add("builder chain 5 ops", () =>
    build(Ok(START))
      .map((n: number) => n + ONE)
      .andThen((n: number) => Ok(n * TWO))
      .mapErr(String)
      .unwrapOr(ZERO),
  )
  .add("builder with tap", () =>
    build(Ok("hello"))
      .tap(() => {
        /* noop */
      })
      .map((s: string) => s.length)
      .unwrapOr(ZERO),
  )

  .add("context() wrap", () => context(Err("fail"), "wrapped"))
  .add("context() with help", () => context(Err("fail"), "wrapped", "try again"))

  .add("all(5 ok)", () => all([Ok(START), Ok(TWO), Ok(THREE), Ok(FOUR), Ok(SAMPLE)]))
  .add("all(5, last err)", () => all([Ok(START), Ok(TWO), Err("x"), Ok(FOUR), Ok(SAMPLE)]))
  .add("any(5 ok)", () => any([Ok(START), Ok(TWO), Ok(THREE), Ok(FOUR), Ok(SAMPLE)]))
  .add("any(5, first ok)", () => any([Err("x"), Err("y"), Ok(THREE), Ok(FOUR), Ok(SAMPLE)]))

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
        } = needle;
        return c;
      }),
    )
      .andThen((arr: number[]) => Ok(arr[IDX] as number))
      .unwrapOr(-1),
  )
  .add("real: deep access (try/catch)", () => {
    try {
      const {
        a: {
          b: { c },
        },
      } = needle;
      return c[IDX] as number;
    } catch {
      return -1;
    }
  })
  .add("real: legacy throw (ripthrow)", () =>
    andThen(
      safe(() => legacyThrow(START)),
      (v: number) => Ok(v * TWO),
    ),
  )
  .add("real: legacy throw (try/catch)", () => {
    try {
      return legacyThrow(START) * TWO;
    } catch {
      return -1;
    }
  });

await bench.run();

const MAX = Math.max(...bench.tasks.map((t: Task) => t.name.length));
// biome-ignore lint/suspicious/noConsole: benchmark output
console.log(
  `\n  ${"Benchmark".padEnd(MAX)}  ${"ops/s".padStart(PAD_OPS)}  ${"latency".padStart(PAD_NS)}  ${"samples".padStart(PAD_SAMPLES)}`,
);
// biome-ignore lint/suspicious/noConsole: benchmark output
console.log(`  ${"─".repeat(MAX + LINE_EXTRA)}`);
for (const t of bench.tasks) {
  const r = t.result;
  if (r && r.state === "completed") {
    const ops = Math.round(r.throughput.mean).toLocaleString().padStart(PAD_OPS);
    const ns = (r.latency.mean * MILLION).toFixed(NS_FIXED).padStart(NS_WIDTH);
    const n = r.latency.samplesCount.toLocaleString().padStart(PAD_SAMPLES);
    // biome-ignore lint/suspicious/noConsole: benchmark output
    console.log(`  ${t.name.padEnd(MAX)}  ${ops}  ${ns} ns  ${n}`);
  }
}
