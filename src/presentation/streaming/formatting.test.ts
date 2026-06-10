import { describe, expect, it } from "vitest";
import {
  formatAvg,
  formatHitRate,
  presetRange,
} from "@/src/presentation/streaming/formatting";

// formatAvg(avg) -> "21.3" (one decimal) or "—" for null
// formatHitRate(rate) -> "52%" (whole percent) or "—" for null
// presetRange(preset, today) -> {startDate, endDate} as YYYY-MM-DD strings;
//   "season" starts Mar 1 of today's year; "30"/"14"/"7" are day lookbacks.
//   endDate is always today.

const TODAY = new Date("2026-06-10T00:00:00Z");

describe("formatAvg", () => {
  it("formats to one decimal", () => {
    expect(formatAvg(21.34)).toBe("21.3");
    expect(formatAvg(15)).toBe("15.0");
  });

  it("renders null as an em dash", () => {
    expect(formatAvg(null)).toBe("—");
  });
});

describe("formatHitRate", () => {
  it("formats a fraction as a whole percent", () => {
    expect(formatHitRate(0.523)).toBe("52%");
    expect(formatHitRate(1)).toBe("100%");
    expect(formatHitRate(0)).toBe("0%");
  });

  it("renders null as an em dash", () => {
    expect(formatHitRate(null)).toBe("—");
  });
});

describe("presetRange", () => {
  it("season preset starts March 1", () => {
    expect(presetRange("season", TODAY)).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-06-10",
    });
  });

  it("day-count presets look back from today", () => {
    expect(presetRange("30", TODAY)).toEqual({
      startDate: "2026-05-11",
      endDate: "2026-06-10",
    });
    expect(presetRange("7", TODAY)).toEqual({
      startDate: "2026-06-03",
      endDate: "2026-06-10",
    });
  });
});
