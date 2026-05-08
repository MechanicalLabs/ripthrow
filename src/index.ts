/**
 * ripthrow: A tiny, type-safe Result type for TypeScript.
 * Inspired by Rust's Result and the proposed Error Handling Operator (?=).
 *
 * This library provides a structured way to handle success and failure
 * without relying on exceptions, promoting safer and more predictable code.
 *
 * @module ripthrow
 */

export * from "./consumers";
export * from "./factories";
export * from "./operators";
export * from "./pattern";
export * from "./report";
export * from "./result-builder";
export * from "./result-builder-async";
export type * from "./types";
export * from "./utils";
