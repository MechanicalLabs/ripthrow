import { describe, expect, test } from "bun:test";
import { Err, Ok } from "../factories";
import { orElse } from ".";

describe("orElse", () => {
  test("should recover from Err", () => {
    const result = Err("failed");
    const recovered = orElse(result, (err) => Ok(`Recovered from ${err}`));
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.value).toBe("Recovered from failed");
    }
  });

  test("should map Err to another Err", () => {
    const result = Err("failed");
    const remapped = orElse(result, (err) => Err(`Mapped: ${err}`));
    expect(remapped.ok).toBe(false);
    if (!remapped.ok) {
      expect(remapped.error).toBe("Mapped: failed");
    }
  });

  test("should skip if initial result is Ok", () => {
    const result = Ok("success");
    const recovered = orElse(result, () => Ok("recovered"));
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.value).toBe("success");
    }
  });
});
