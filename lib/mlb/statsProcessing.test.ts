import { describe, it, expect } from "vitest";
import {
  extractBattingStats,
  extractPitchingStats,
  calculateBattingPointsFromRaw,
  calculatePitchingPointsFromRaw,
  createBattingStats,
  createPitchingStats,
  RawBattingStats,
  RawPitchingStats,
} from "@/lib/mlb/statsProcessing";

describe("extractBattingStats", () => {
  it("maps nested MLB box-score fields (strikeOuts/baseOnBalls renames)", () => {
    const player = {
      stats: {
        batting: {
          atBats: 4,
          hits: 2,
          doubles: 1,
          triples: 0,
          homeRuns: 1,
          rbi: 3,
          runs: 1,
          stolenBases: 1,
          strikeOuts: 2,
          baseOnBalls: 1,
        },
      },
    };
    expect(extractBattingStats(player)).toEqual({
      atBats: 4,
      hits: 2,
      doubles: 1,
      triples: 0,
      homeRuns: 1,
      rbi: 3,
      runs: 1,
      stolenBases: 1,
      strikeouts: 2,
      walks: 1,
    });
  });

  it("defaults every field to 0 when batting stats are absent", () => {
    expect(extractBattingStats({})).toEqual({
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 0,
      runs: 0,
      stolenBases: 0,
      strikeouts: 0,
      walks: 0,
    });
  });
});

describe("extractPitchingStats", () => {
  it("maps nested fields (hits=>hitsAllowed, baseOnBalls=>walksIssued)", () => {
    const player = {
      stats: {
        pitching: {
          inningsPitched: "6.2",
          earnedRuns: 2,
          strikeOuts: 7,
          hits: 5,
          baseOnBalls: 1,
          wins: 1,
          losses: 0,
          saves: 0,
          holds: 1,
          gamesStarted: 1,
        },
      },
    };
    expect(extractPitchingStats(player)).toEqual({
      inningsPitched: "6.2",
      earnedRuns: 2,
      strikeouts: 7,
      hitsAllowed: 5,
      walksIssued: 1,
      wins: 1,
      losses: 0,
      saves: 0,
      holds: 1,
      gamesStarted: 1,
    });
  });

  it("defaults inningsPitched to 0, holds to null, the rest to 0", () => {
    expect(extractPitchingStats({})).toEqual({
      inningsPitched: 0,
      earnedRuns: 0,
      strikeouts: 0,
      hitsAllowed: 0,
      walksIssued: 0,
      wins: 0,
      losses: 0,
      saves: 0,
      holds: null,
      gamesStarted: 0,
    });
  });
});

describe("calculateBattingPointsFromRaw", () => {
  it("scores a raw batting line via the shared scoring rules", () => {
    const raw: RawBattingStats = {
      atBats: 4,
      hits: 4,
      doubles: 1,
      triples: 0,
      homeRuns: 1,
      rbi: 3,
      runs: 2,
      stolenBases: 1,
      strikeouts: 2,
      walks: 1,
    };
    // 2 singles + 1 double + 1 HR => 8 TB; +1 BB +2 R +3 RBI +1 SB -2 K = 13
    expect(calculateBattingPointsFromRaw(raw)).toBe(13);
  });
});

describe("calculatePitchingPointsFromRaw", () => {
  it("scores a raw pitching line, coercing innings to a string", () => {
    const raw: RawPitchingStats = {
      inningsPitched: "7.0", // 21 outs
      earnedRuns: 2, // -4
      strikeouts: 9, // +9
      hitsAllowed: 4, // -4
      walksIssued: 1, // -1
      wins: 1, // +2
      losses: 0,
      saves: 0,
      holds: null,
      gamesStarted: 1,
    };
    expect(calculatePitchingPointsFromRaw(raw)).toBe(23);
  });

  it("accepts a numeric inningsPitched", () => {
    const raw: RawPitchingStats = {
      inningsPitched: 7, // "7" => 21 outs
      earnedRuns: 0,
      strikeouts: 0,
      hitsAllowed: 0,
      walksIssued: 0,
      wins: 0,
      losses: 0,
      saves: 0,
      holds: null,
      gamesStarted: 1,
    };
    expect(calculatePitchingPointsFromRaw(raw)).toBe(21);
  });
});

describe("createBattingStats", () => {
  const raw: RawBattingStats = {
    atBats: 4,
    hits: 3,
    doubles: 1,
    triples: 0,
    homeRuns: 1,
    rbi: 2,
    runs: 1,
    stolenBases: 1,
    strikeouts: 1,
    walks: 2,
  };

  it("builds a BattingStats value object (doubles/triples not retained)", () => {
    const result = createBattingStats(raw);
    expect(result.toJSON()).toEqual({
      atBats: 4,
      hits: 3,
      homeRuns: 1,
      rbi: 2,
      runs: 1,
      stolenBases: 1,
      strikeouts: 1,
      walks: 2,
    });
  });

  it("throws when hits exceed at bats", () => {
    expect(() => createBattingStats({ ...raw, hits: 5, atBats: 3 })).toThrow(
      "Hits cannot exceed at bats"
    );
  });

  it("throws on negative stats", () => {
    expect(() => createBattingStats({ ...raw, runs: -1 })).toThrow(
      "Stats cannot be negative"
    );
  });
});

describe("createPitchingStats", () => {
  const raw: RawPitchingStats = {
    inningsPitched: "6.2",
    earnedRuns: 2,
    strikeouts: 7,
    hitsAllowed: 5,
    walksIssued: 1,
    wins: 1,
    losses: 0,
    saves: 0,
    holds: 2,
    gamesStarted: 1,
  };

  it("parses innings with parseFloat and preserves holds", () => {
    const result = createPitchingStats(raw);
    expect(result.toJSON()).toEqual({
      inningsPitched: 6.2,
      earnedRuns: 2,
      pitchingStrikeouts: 7,
      hitsAllowed: 5,
      walksIssued: 1,
      wins: 1,
      losses: 0,
      saves: 0,
      holds: 2,
      gamesStarted: 1,
    });
  });

  it("treats a falsy inningsPitched as 0 and keeps null holds", () => {
    const result = createPitchingStats({
      ...raw,
      inningsPitched: 0,
      holds: null,
    });
    expect(result.inningsPitched).toBe(0);
    expect(result.holds).toBeNull();
  });
});
