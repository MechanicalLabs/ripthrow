import { describe, expect, test } from "bun:test";
import { Report } from "./report";

describe("Report", () => {
  test("should store message and options", () => {
    const report = new Report("failed", { help: "try again", context: { id: 1 } });
    expect(report.message).toBe("failed");
    expect(report.help).toBe("try again");
    expect(report.context).toEqual({ id: 1 });
  });

  test("Report.from should wrap Error", () => {
    const error = new Error("base error");
    const report = Report.from(error, "context message");
    expect(report.message).toBe("context message");
    expect(report.cause).toBe(error);
  });

  test("Report.from should return same Report if no changes", () => {
    const report = new Report("failed");
    const sameReport = Report.from(report);
    expect(sameReport).toBe(report);
  });
});
