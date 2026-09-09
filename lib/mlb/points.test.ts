import { describe, it, expect } from "vitest";
import { YAHOO } from "@/lib/mlb/points";
import { MLBStats } from "@/lib/types/mlb";

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

    it("scores hit by pitch at 2.6", () => {
      expect(YAHOO.calculateBattingPoints({ hitByPitch: 1 })).toBeCloseTo(2.6, 10)
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

    it("scores a full pitching line", () => {
      // "6.0" => 18 outs + win (8) + 7 K (21) + 5 hits (-6.5) + 2 ER (-6) + 1 BB (-1.3)
      expect(YAHOO.calculatePitchingPoints({ inningsPitched: "6.0", wins: 1, pitchingStrikeouts: 7, hitsAllowed: 5, earnedRuns: 2, walksIssued: 1 })).toBeCloseTo(33.2, 10)
    })

    it("scores hit batters at -1.3", () => {
      // Mapped from the API's stats.pitching.hitBatsmen during extraction.
      expect(YAHOO.calculatePitchingPoints({ hitBatters: 1 })).toBeCloseTo(-1.3, 10)
    })

  })

  describe('POINTS_SYSTEM', () => {
    it("locks the published Yahoo weights", () => {
      expect(YAHOO.POINTS_SYSTEM.runs).toBe(1.9)
      expect(YAHOO.POINTS_SYSTEM.singles).toBe(2.6)
      expect(YAHOO.POINTS_SYSTEM.doubles).toBe(5.2)
      expect(YAHOO.POINTS_SYSTEM.triples).toBe(7.8)
      expect(YAHOO.POINTS_SYSTEM.homeRuns).toBe(10.4)
      expect(YAHOO.POINTS_SYSTEM.rbis).toBe(1.9)
      expect(YAHOO.POINTS_SYSTEM.stolenBases).toBe(4.2)
      expect(YAHOO.POINTS_SYSTEM.walks).toBe(2.6)
      expect(YAHOO.POINTS_SYSTEM.hitByPitch).toBe(2.6)
      expect(YAHOO.POINTS_SYSTEM.wins).toBe(8)
      expect(YAHOO.POINTS_SYSTEM.saves).toBe(8)
      expect(YAHOO.POINTS_SYSTEM.outs).toBe(1)
      expect(YAHOO.POINTS_SYSTEM.hitsAllowed).toBe(-1.3)
      expect(YAHOO.POINTS_SYSTEM.earnedRuns).toBe(-3)
      expect(YAHOO.POINTS_SYSTEM.walksIssued).toBe(-1.3)
      expect(YAHOO.POINTS_SYSTEM.hitBatters).toBe(-1.3)
      expect(YAHOO.POINTS_SYSTEM.pitchingStrikeouts).toBe(3)
    })
  })
})

