import { describe, expect, test } from "bun:test";
import { Report } from "../report";
import { bail } from "./bail";

describe("bail", () => {
  test("should create a Report", () => {
    const report = bail("error message", { help: "fix it" });
    expect(report).toBeInstanceOf(Report);
    expect(report.message).toBe("error message");
    expect(report.help).toBe("fix it");
  });
});
