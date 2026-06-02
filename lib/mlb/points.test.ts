import { describe, it, expect } from "vitest";
import {
  POINTS_SYSTEM,
  calculateBattingPoints,
  calculatePitchingPoints,
} from "@/lib/mlb/points";
import { MLBStats } from "@/lib/types/mlb";

describe("calculateBattingPoints", () => {
  it("returns 0 for empty stats", () => {
    expect(calculateBattingPoints({})).toBe(0);
  });

  it("scores singles as 1 total base each", () => {
    // 3 hits, none for extra bases => 3 singles => 3 total bases
    expect(calculateBattingPoints({ hits: 3 })).toBe(3);
  });

  it("weights extra-base hits (single=1, double=2, triple=3, HR=4)", () => {
    // 4 hits: 1 double + 1 triple + 1 HR => 1 single remains
    // total bases = 1 + 2 + 3 + 4 = 10
    const stats: MLBStats = { hits: 4, doubles: 1, triples: 1, homeRuns: 1 };
    expect(calculateBattingPoints(stats)).toBe(10);
  });

  it("never produces negative singles when extra-base hits exceed hits", () => {
    // Defensive: doubles alone exceed hits; singles clamps to 0.
    // total bases = 0 singles + 2*2 = 4
    expect(calculateBattingPoints({ hits: 1, doubles: 2 })).toBe(4);
  });

  it("adds 1 point each for walks, runs, rbi, and stolen bases", () => {
    expect(calculateBattingPoints({ walks: 2 })).toBe(2);
    expect(calculateBattingPoints({ runs: 2 })).toBe(2);
    expect(calculateBattingPoints({ rbi: 2 })).toBe(2);
    expect(calculateBattingPoints({ stolenBases: 2 })).toBe(2);
  });

  it("subtracts 1 point per strikeout", () => {
    expect(calculateBattingPoints({ strikeouts: 3 })).toBe(-3);
  });

  it("scores a full batting line", () => {
    // 2 singles (4 hits - 1 dbl - 1 HR), 1 double, 1 HR
    // total bases = 2 + 2 + 4 = 8; +1 walk +2 runs +3 rbi +1 SB -2 K
    const stats: MLBStats = {
      hits: 4,
      doubles: 1,
      homeRuns: 1,
      walks: 1,
      runs: 2,
      rbi: 3,
      stolenBases: 1,
      strikeouts: 2,
    };
    // 8 + 1 + 2 + 3 + 1 - 2 = 13
    expect(calculateBattingPoints(stats)).toBe(13);
  });
});

describe("calculatePitchingPoints", () => {
  it("returns 0 for empty stats", () => {
    expect(calculatePitchingPoints({})).toBe(0);
  });

  it("scores each out as 1 point (innings.fraction => outs)", () => {
    // "6.2" => 6*3 + 2 = 20 outs => 20 points
    expect(calculatePitchingPoints({ inningsPitched: "6.2" })).toBe(20);
  });

  it("treats whole innings (no fraction) as full innings", () => {
    // "6.0" and "6" both => 18 outs
    expect(calculatePitchingPoints({ inningsPitched: "6.0" })).toBe(18);
    expect(calculatePitchingPoints({ inningsPitched: "6" })).toBe(18);
  });

  it("applies pitching point weights", () => {
    expect(calculatePitchingPoints({ earnedRuns: 3 })).toBe(-6);
    expect(calculatePitchingPoints({ wins: 1 })).toBe(2);
    expect(calculatePitchingPoints({ losses: 1 })).toBe(-2);
    expect(calculatePitchingPoints({ saves: 1 })).toBe(5);
    expect(calculatePitchingPoints({ pitchingStrikeouts: 4 })).toBe(4);
    expect(calculatePitchingPoints({ hitsAllowed: 5 })).toBe(-5);
    expect(calculatePitchingPoints({ walksIssued: 2 })).toBe(-2);
    expect(calculatePitchingPoints({ holds: 1 })).toBe(2);
  });

  it("scores a full pitching line", () => {
    const stats: MLBStats = {
      inningsPitched: "7.0", // 21 outs => 21
      earnedRuns: 2, // -4
      wins: 1, // +2
      pitchingStrikeouts: 9, // +9
      hitsAllowed: 4, // -4
      walksIssued: 1, // -1
    };
    // 21 - 4 + 2 + 9 - 4 - 1 = 23
    expect(calculatePitchingPoints(stats)).toBe(23);
  });
});

describe("POINTS_SYSTEM", () => {
  it("documents the scoring weights used across the app", () => {
    expect(POINTS_SYSTEM.totalBases).toBe(1);
    expect(POINTS_SYSTEM.strikeouts).toBe(-1);
    expect(POINTS_SYSTEM.saves).toBe(5);
    expect(POINTS_SYSTEM.earnedRuns).toBe(-2);
  });
});
