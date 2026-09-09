import { describe, expect, it } from "vitest";
import { mondayOnOrBefore, seasonWeeks, weekIndexFor } from "./weeks";

describe("weeks", () => {
  describe("mondayOnOrBefore", () => {
    it("returns the same day for a Monday", () => {
      expect(mondayOnOrBefore("2026-03-23")).toBe("2026-03-23");
    });
    it("walks back from midweek", () => {
      // 2026-03-25 is a Wednesday
      expect(mondayOnOrBefore("2026-03-25")).toBe("2026-03-23");
    });
    it("walks back six days from a Sunday", () => {
      expect(mondayOnOrBefore("2026-03-29")).toBe("2026-03-23");
    });
    it("rejects malformed dates", () => {
      expect(() => mondayOnOrBefore("not-a-date")).toThrow(/Invalid date/);
    });
  });

  describe("seasonWeeks", () => {
    it("anchors week 1 to the Monday on or before opening day", () => {
      const weeks = seasonWeeks("2026-03-25", "2026-04-05");
      expect(weeks).toEqual([
        { week: 1, start: "2026-03-23", end: "2026-03-29" },
        { week: 2, start: "2026-03-30", end: "2026-04-05" },
      ]);
    });

    it("includes a trailing partial week that contains the final day", () => {
      const weeks = seasonWeeks("2026-03-23", "2026-04-07"); // Tue end
      expect(weeks).toHaveLength(3);
      expect(weeks[2]).toEqual({ week: 3, start: "2026-04-06", end: "2026-04-12" });
    });

    it("covers a full MLB season in 27 weeks", () => {
      expect(seasonWeeks("2026-03-25", "2026-09-27")).toHaveLength(27);
    });

    it("rejects an end before the start", () => {
      expect(() => seasonWeeks("2026-04-01", "2026-03-01")).toThrow();
    });
  });

  describe("weekIndexFor", () => {
    const weeks = seasonWeeks("2026-03-25", "2026-04-12");

    it("places opening day in week 1", () => {
      expect(weekIndexFor("2026-03-25", weeks)).toBe(0);
    });
    it("places a Sunday in the same week as its Monday", () => {
      expect(weekIndexFor("2026-03-29", weeks)).toBe(0);
      expect(weekIndexFor("2026-03-30", weeks)).toBe(1);
    });
    it("returns -1 for days outside the season", () => {
      expect(weekIndexFor("2026-03-22", weeks)).toBe(-1);
      expect(weekIndexFor("2026-04-13", weeks)).toBe(-1);
      expect(weekIndexFor("2026-04-01", [])).toBe(-1);
    });
  });
});
