import { describe, expect, it } from "vitest";
import { parsePositiveInt, parseSeason } from "./params";

describe("parsePositiveInt", () => {
  it("accepts positive integers", () => {
    expect(parsePositiveInt("660271")).toBe(660271);
  });
  it("rejects zero, negatives, decimals, text, and missing values", () => {
    for (const bad of ["0", "-1", "1.5", "abc", "", null, undefined]) {
      expect(parsePositiveInt(bad)).toBeNull();
    }
  });
});

describe("parseSeason", () => {
  it("accepts four-digit years", () => {
    expect(parseSeason("2026")).toBe(2026);
  });
  it("rejects anything else", () => {
    for (const bad of ["26", "20260", "abcd", "", null]) {
      expect(parseSeason(bad)).toBeNull();
    }
  });
});
