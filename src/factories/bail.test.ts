import { describe, expect, test } from "bun:test";
import { isReport } from "../report";
import { bail } from ".";

describe("bail", () => {
  test("should create a Report", () => {
    const report = bail("error message", { help: "fix it" });
    expect(isReport(report)).toBe(true);
    expect(report.message).toBe("error message");
    expect(report.help).toBe("fix it");
  });
});
