import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { createReport } from "../report";
import { note } from "./note";

const VALUE = 42;

describe("note", () => {
  test("should add a note to a plain Err", () => {
    const result = Err("something broke");
    const noted = note(result, "failed in module X");

    expect(noted.ok).toBe(false);
    if (!noted.ok) {
      expect(noted.error.notes).toEqual(["failed in module X"]);
      expect(noted.error.message).toBe("something broke");
    }
  });

  test("should accumulate multiple notes", () => {
    const result = Err("db error");
    const noted = note(note(result, "step 1"), "step 2");

    expect(noted.ok).toBe(false);
    if (!noted.ok) {
      expect(noted.error.notes).toEqual(["step 1", "step 2"]);
      expect(noted.error.message).toBe("db error");
    }
  });

  test("should not modify Ok result", () => {
    const result = Ok(VALUE);
    const noted = note(result, "should not appear");

    expect(noted.ok).toBe(true);
    if (noted.ok) {
      expect(noted.value).toBe(VALUE);
    }
  });
});

describe("note with Report", () => {
  test("should preserve help from existing Report", () => {
    const report = createReport("failed", { help: "try again" });
    const result = Err(report);
    const noted = note(result, "additional context");

    expect(noted.ok).toBe(false);
    if (!noted.ok) {
      expect(noted.error.help).toBe("try again");
      expect(noted.error.notes).toEqual(["additional context"]);
    }
  });

  test("should preserve message from existing Report", () => {
    const report = createReport("original message", { notes: ["prior note"] });
    const result = Err(report);
    const noted = note(result, "another note");

    expect(noted.ok).toBe(false);
    if (!noted.ok) {
      expect(noted.error.message).toBe("original message");
      expect(noted.error.notes).toEqual(["prior note", "another note"]);
    }
  });

  test("should preserve cause chain", () => {
    const inner = new Error("inner error");
    const report = createReport("outer", { cause: inner });
    const result = Err(report);
    const noted = note(result, "with note");

    expect(noted.ok).toBe(false);
    if (!noted.ok) {
      expect(noted.error.cause).toBe(report);
    }
  });
});
