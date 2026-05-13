/**
 * ripthrow: A tiny, type-safe Result type for TypeScript.
 * Inspired by Rust's Result and the proposed Error Handling Operator (?=).
 *
 * This library provides a structured way to handle success and failure
 * without relying on exceptions, promoting safer and more predictable code.
 *
 * @module ripthrow
 */

export { match, unwrap, unwrapOr } from "./consumers";
export { bail, Err, isErr, isOk, Ok, safe, safeAsync } from "./factories";
export { andThen, context, map, mapErr, note, orElse, tap, tapErr } from "./operators";
export type { ErrFactory, MatchErrBuilder } from "./pattern";
export { createError, createErrors, matchErr, wrapError } from "./pattern";
export type { Report, ReportOptions } from "./report";
export { createReport, isReport, reportFrom } from "./report";
export { build, createResultBuilder, ResultBuilder } from "./result-builder";
export { AsyncResultBuilder, buildAsync, createAsyncResultBuilder } from "./result-builder-async";
export type { AsyncResult, Result } from "./types";
export { all, any, kindOf, pipe } from "./utils";
