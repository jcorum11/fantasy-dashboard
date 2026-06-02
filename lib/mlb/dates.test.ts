import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isValidDateFormat,
  isFutureDate,
  getGameAvailabilityMessage,
  getYesterdayMLB,
  canNavigateToDate,
  getNextValidDate,
  getPreviousValidDate,
} from "@/lib/mlb/dates";

// Pin "now" to 2026-06-02 noon America/New_York (16:00 UTC during EDT) so every
// function that reads getMLBDate() is deterministic regardless of the host tz.
const FIXED_NOW = new Date("2026-06-02T16:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isValidDateFormat", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(isValidDateFormat("2026-06-02")).toBe(true);
  });

  it("rejects unpadded, reordered, or extended formats", () => {
    expect(isValidDateFormat("2026-6-2")).toBe(false);
    expect(isValidDateFormat("06-02-2026")).toBe(false);
    expect(isValidDateFormat("2026-06-02T00:00")).toBe(false);
    expect(isValidDateFormat("not-a-date")).toBe(false);
    expect(isValidDateFormat("")).toBe(false);
  });
});

describe("isFutureDate", () => {
  it("treats malformed dates as future (caller guard)", () => {
    expect(isFutureDate("garbage")).toBe(true);
  });

  it("returns true for dates after today", () => {
    expect(isFutureDate("2026-06-03")).toBe(true);
  });

  it("returns false for today and past dates", () => {
    expect(isFutureDate("2026-06-02")).toBe(false);
    expect(isFutureDate("2026-06-01")).toBe(false);
  });
});

describe("getGameAvailabilityMessage", () => {
  it("flags a future season", () => {
    expect(getGameAvailabilityMessage("2027-04-01")).toBe(
      "Schedule for the 2027 MLB season is not yet available. Please check back later."
    );
  });

  it("flags a past season", () => {
    expect(getGameAvailabilityMessage("2025-04-01")).toBe(
      "No games were played on April 1, 2025 (past season)."
    );
  });

  it("flags a future date in the current season", () => {
    expect(getGameAvailabilityMessage("2026-06-15")).toBe(
      "No games are scheduled for June 15, 2026 yet."
    );
  });

  it("reports no games for a past date in the current season", () => {
    expect(getGameAvailabilityMessage("2026-04-01")).toBe(
      "No games were played on April 1, 2026."
    );
  });
});

describe("getYesterdayMLB", () => {
  // NOTE: despite the name, this returns *today's* NY date (it does not
  // subtract a day). Test pins current behavior — see flag to maintainer.
  it("returns the current MLB-timezone date as YYYY-MM-DD", () => {
    expect(getYesterdayMLB()).toBe("2026-06-02");
  });
});

describe("canNavigateToDate", () => {
  it("rejects malformed dates", () => {
    expect(canNavigateToDate("nope")).toBe(false);
  });

  it("rejects future seasons and allows past seasons", () => {
    expect(canNavigateToDate("2027-01-01")).toBe(false);
    expect(canNavigateToDate("2025-08-01")).toBe(true);
  });

  it("allows current-season dates up to the navigable boundary", () => {
    expect(canNavigateToDate("2026-06-02")).toBe(true);
    expect(canNavigateToDate("2026-06-03")).toBe(false);
  });
});

describe("getPreviousValidDate", () => {
  it("falls back to the current MLB date for malformed input", () => {
    expect(getPreviousValidDate("bad")).toBe("2026-06-02");
  });

  it("steps back one day", () => {
    expect(getPreviousValidDate("2026-06-02")).toBe("2026-06-01");
  });

  it("crosses month boundaries", () => {
    expect(getPreviousValidDate("2026-06-01")).toBe("2026-05-31");
  });
});

describe("getNextValidDate", () => {
  it("returns null for malformed input", () => {
    expect(getNextValidDate("bad")).toBeNull();
  });

  it("advances to a navigable next day", () => {
    expect(getNextValidDate("2026-05-31")).toBe("2026-06-01");
  });

  it("returns null when the next day is not navigable", () => {
    expect(getNextValidDate("2026-06-02")).toBeNull();
  });
});
