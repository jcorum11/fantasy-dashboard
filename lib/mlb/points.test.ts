import { describe, it, expect } from "vitest";
import {
  ESPN,
  YAHOO
} from "@/lib/mlb/points";
import { MLBStats } from "@/lib/types/mlb";

describe('ESPN', () => {
  describe("calculateBattingPoints", () => {
    it("returns 0 for empty stats", () => {
      expect(ESPN.calculateBattingPoints({})).toBe(0);
    });

    it("scores singles as 1 total base each", () => {
      // 3 hits, none for extra bases => 3 singles => 3 total bases
      expect(ESPN.calculateBattingPoints({ hits: 3 })).toBe(3);
    });

    it("weights extra-base hits (single=1, double=2, triple=3, HR=4)", () => {
      // 4 hits: 1 double + 1 triple + 1 HR => 1 single remains
      // total bases = 1 + 2 + 3 + 4 = 10
      const stats: MLBStats = { hits: 4, doubles: 1, triples: 1, homeRuns: 1 };
      expect(ESPN.calculateBattingPoints(stats)).toBe(10);
    });

    it("never produces negative singles when extra-base hits exceed hits", () => {
      // Defensive: doubles alone exceed hits; singles clamps to 0.
      // total bases = 0 singles + 2*2 = 4
      expect(ESPN.calculateBattingPoints({ hits: 1, doubles: 2 })).toBe(4);
    });

    it("adds 1 point each for walks, runs, rbi, and stolen bases", () => {
      expect(ESPN.calculateBattingPoints({ walks: 2 })).toBe(2);
      expect(ESPN.calculateBattingPoints({ runs: 2 })).toBe(2);
      expect(ESPN.calculateBattingPoints({ rbi: 2 })).toBe(2);
      expect(ESPN.calculateBattingPoints({ stolenBases: 2 })).toBe(2);
    });

    it("subtracts 1 point per strikeout", () => {
      expect(ESPN.calculateBattingPoints({ strikeouts: 3 })).toBe(-3);
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
      expect(ESPN.calculateBattingPoints(stats)).toBe(13);
    });
  });

  describe("calculatePitchingPoints", () => {
    it("returns 0 for empty stats", () => {
      expect(ESPN.calculatePitchingPoints({})).toBe(0);
    });

    it("scores each out as 1 point (innings.fraction => outs)", () => {
      // "6.2" => 6*3 + 2 = 20 outs => 20 points
      expect(ESPN.calculatePitchingPoints({ inningsPitched: "6.2" })).toBe(20);
    });

    it("treats whole innings (no fraction) as full innings", () => {
      // "6.0" and "6" both => 18 outs
      expect(ESPN.calculatePitchingPoints({ inningsPitched: "6.0" })).toBe(18);
      expect(ESPN.calculatePitchingPoints({ inningsPitched: "6" })).toBe(18);
    });

    it("applies pitching point weights", () => {
      expect(ESPN.calculatePitchingPoints({ earnedRuns: 3 })).toBe(-6);
      expect(ESPN.calculatePitchingPoints({ wins: 1 })).toBe(2);
      expect(ESPN.calculatePitchingPoints({ losses: 1 })).toBe(-2);
      expect(ESPN.calculatePitchingPoints({ saves: 1 })).toBe(5);
      expect(ESPN.calculatePitchingPoints({ pitchingStrikeouts: 4 })).toBe(4);
      expect(ESPN.calculatePitchingPoints({ hitsAllowed: 5 })).toBe(-5);
      expect(ESPN.calculatePitchingPoints({ walksIssued: 2 })).toBe(-2);
      expect(ESPN.calculatePitchingPoints({ holds: 1 })).toBe(2);
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
      expect(ESPN.calculatePitchingPoints(stats)).toBe(23);
    });
  });

  describe("POINTS_SYSTEM", () => {
    it("documents the scoring weights used across the app", () => {
      expect(ESPN.POINTS_SYSTEM.totalBases).toBe(1);
      expect(ESPN.POINTS_SYSTEM.strikeouts).toBe(-1);
      expect(ESPN.POINTS_SYSTEM.saves).toBe(5);
      expect(ESPN.POINTS_SYSTEM.earnedRuns).toBe(-2);
    });
  });
})

describe('Yahoo', () => {
  describe('calculateBattingPoints', () => {
    it("returns 0 if all stats are empty", () => {
      expect(YAHOO.calculateBattingPoints({})).toBe(0)
    })
    it("multiplies batting runs by 1.9", () => {
      expect(() => YAHOO.calculateBattingPoints({ runs: -1 })).toThrowError("runs cannot be negative")
      expect(YAHOO.calculateBattingPoints({ runs: 0 })).toBe(0)
      expect(YAHOO.calculateBattingPoints({ runs: 1 })).toBeCloseTo(1.9, 10)
      expect(YAHOO.calculateBattingPoints({ runs: 5 })).toBeCloseTo(9.5, 10)
      expect(YAHOO.calculateBattingPoints({ runs: 100 })).toBeCloseTo(190, 10)
      expect(() => YAHOO.calculateBattingPoints({ runs: 1.2 })).toThrowError("runs must be a whole number")
    })

    it("doesn't count strikeouts as negative", () => {
      expect(YAHOO.calculateBattingPoints({ strikeouts: 5 })).toBe(0)
      expect(YAHOO.calculateBattingPoints({ strikeouts: 0 })).toBe(0)
      expect(YAHOO.calculateBattingPoints({ strikeouts: -1 })).toBe(0)
    })

    it("derives singles by subtracting extra-base hits", () => {
      // 4 hits = 1 single + 1 double + 1 triple + 1 HR => 2.6 + 5.2 + 7.8 + 10.4
      expect(YAHOO.calculateBattingPoints({ hits: 4, doubles: 1, triples: 1, homeRuns: 1 })).toBeCloseTo(26, 10)
    })

    it("clamps singles to zero when extra-base hits exceed hits", () => {
      // 1 hit but 2 doubles => 0 singles + 2 * 5.2
      expect(YAHOO.calculateBattingPoints({ hits: 1, doubles: 2 })).toBeCloseTo(10.4, 10)
    })

    it("scores a full batting line", () => {
      // 2 singles (5.2) + double (5.2) + triple (7.8) + HR (10.4) + 2 runs (3.8)
      // + 3 rbi (5.7) + 1 sb (4.2) + 1 bb (2.6); strikeouts ignored
      expect(YAHOO.calculateBattingPoints({ hits: 5, doubles: 1, triples: 1, homeRuns: 1, runs: 2, rbi: 3, stolenBases: 1, walks: 1, strikeouts: 4 })).toBeCloseTo(44.9, 10)
    })

  })

  describe('calculatePitchingPoints', () => {
    it("multiplies pitching outs by 1", () => {
      expect(() => YAHOO.calculatePitchingPoints({ inningsPitched: "-1" })).toThrowError('inningsPitched cannot be negative')
      expect(YAHOO.calculatePitchingPoints({ inningsPitched: "0" })).toBe(0)
      expect(YAHOO.calculatePitchingPoints({ inningsPitched: "5.1" })).toBeCloseTo(16, 10)
      expect(YAHOO.calculatePitchingPoints({ inningsPitched: "5.0" })).toBeCloseTo(15, 10)
      expect(YAHOO.calculatePitchingPoints({ inningsPitched: "9" })).toBeCloseTo(27, 10)
      expect(YAHOO.calculatePitchingPoints({ inningsPitched: "10" })).toBeCloseTo(30, 10)
    })

    it("doesn't count pitcher losses as negative", () => {
      expect(YAHOO.calculatePitchingPoints({ losses: 1 })).toBe(0)
      expect(YAHOO.calculatePitchingPoints({ losses: 0 })).toBe(0)
      expect(YAHOO.calculatePitchingPoints({ losses: -1 })).toBe(0)
    })

    it("doesn't count holds at all", () => {
      expect(YAHOO.calculatePitchingPoints({ holds: 1 })).toBe(0)
      expect(YAHOO.calculatePitchingPoints({ holds: -1 })).toBe(0)
      expect(YAHOO.calculatePitchingPoints({ holds: 0 })).toBe(0)
    })

  })
})

