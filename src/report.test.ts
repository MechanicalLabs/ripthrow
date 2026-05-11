import { describe, expect, test } from "bun:test";
import { createReport, reportFrom } from "./report";

describe("Report", () => {
  test("should store message and options", () => {
    const report = createReport("failed", { help: "try again", context: { id: 1 } });
    expect(report.message).toBe("failed");
    expect(report.help).toBe("try again");
    expect(report.context).toEqual({ id: 1 });
  });

  test("reportFrom should wrap Error", () => {
    const error = new Error("base error");
    const report = reportFrom(error, "context message");
    expect(report.message).toBe("context message");
    expect(report.cause).toBe(error);
  });

  test("reportFrom should return same Report if no changes", () => {
    const report = createReport("failed");
    const sameReport = reportFrom(report);
    expect(sameReport).toBe(report);
  });
});
