import { describe, it, expect } from "vitest";
import { determinePlayerPosition, hasRelevantStats } from "@/lib/mlb/playerUtils";
import { BattingStats } from "@/src/domain/models/BattingStats";
import { PitchingStats } from "@/src/domain/models/PitchingStats";

// PitchingStats.create(ip, er, k, hits, bb, w, l, sv, holds, gs)
function pitching({
  inningsPitched = 0,
  saves = 0,
  holds = null as number | null,
  gamesStarted = 0,
} = {}): PitchingStats {
  return PitchingStats.create(
    inningsPitched,
    0,
    0,
    0,
    0,
    0,
    0,
    saves,
    holds,
    gamesStarted
  );
}

// BattingStats.create(ab, h, hr, rbi, r, sb, k, bb)
function batting({ atBats = 0, walks = 0, strikeouts = 0 } = {}): BattingStats {
  return BattingStats.create(atBats, 0, 0, 0, 0, 0, strikeouts, walks);
}

describe("determinePlayerPosition", () => {
  it("returns the listed position when the player did not pitch", () => {
    const player = {
      position: { abbreviation: "SS" },
      stats: { pitching: { gamesPlayed: 0 } },
    };
    expect(determinePlayerPosition(player, pitching())).toBe("SS");
  });

  it("returns SP when the player started", () => {
    const player = {
      position: { abbreviation: "P" },
      stats: { pitching: { gamesPlayed: 1, gamesStarted: 1 } },
    };
    expect(determinePlayerPosition(player, pitching())).toBe("SP");
  });

  it("returns RP for a reliever with a save", () => {
    const player = {
      position: { abbreviation: "P" },
      stats: { pitching: { gamesPlayed: 1, gamesStarted: 0 } },
    };
    expect(
      determinePlayerPosition(player, pitching({ saves: 1, holds: null }))
    ).toBe("RP");
  });

  it("returns RP when holds is recorded (not null)", () => {
    const player = {
      position: { abbreviation: "P" },
      stats: { pitching: { gamesPlayed: 1, gamesStarted: 0 } },
    };
    expect(determinePlayerPosition(player, pitching({ holds: 0 }))).toBe("RP");
  });

  it("falls back to innings: >=4 => SP, otherwise RP", () => {
    const player = {
      position: { abbreviation: "P" },
      stats: { pitching: { gamesPlayed: 1, gamesStarted: 0 } },
    };
    expect(
      determinePlayerPosition(player, pitching({ inningsPitched: 5 }))
    ).toBe("SP");
    expect(
      determinePlayerPosition(player, pitching({ inningsPitched: 2 }))
    ).toBe("RP");
  });
});

describe("hasRelevantStats", () => {
  it("is false when nothing meaningful was recorded", () => {
    expect(hasRelevantStats(batting(), pitching())).toBe(false);
  });

  it("is true on any batting activity", () => {
    expect(hasRelevantStats(batting({ atBats: 1 }), pitching())).toBe(true);
    expect(hasRelevantStats(batting({ walks: 1 }), pitching())).toBe(true);
    expect(hasRelevantStats(batting({ strikeouts: 1 }), pitching())).toBe(true);
  });

  it("is true on any pitching activity", () => {
    expect(hasRelevantStats(batting(), pitching({ inningsPitched: 1 }))).toBe(
      true
    );
  });
});
