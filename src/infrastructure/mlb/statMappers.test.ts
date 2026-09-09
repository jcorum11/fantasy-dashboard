import { describe, expect, it } from "vitest";
import { mapHittingStat, mapPitchingStat, mapStat } from "./statMappers";

describe("statMappers", () => {
  it("maps a hitting line onto batting fields, renaming API names", () => {
    expect(
      mapHittingStat({
        hits: 2,
        doubles: 1,
        triples: 0,
        homeRuns: 1,
        rbi: 3,
        runs: 2,
        stolenBases: 1,
        baseOnBalls: 1,
        hitByPitch: 0,
        strikeOuts: 1, // batter K, not scored
      })
    ).toEqual({
      hits: 2,
      doubles: 1,
      triples: 0,
      homeRuns: 1,
      rbi: 3,
      runs: 2,
      stolenBases: 1,
      walks: 1,
      hitByPitch: 0,
    });
  });

  it("maps a pitching line, treating shared names as pitcher stats", () => {
    expect(
      mapPitchingStat({
        inningsPitched: "6.2",
        earnedRuns: 2,
        wins: 1,
        saves: 0,
        strikeOuts: 8,
        hits: 5,
        baseOnBalls: 2,
        hitBatsmen: 1,
        homeRuns: 1, // HR allowed, not scored
      })
    ).toEqual({
      inningsPitched: "6.2",
      earnedRuns: 2,
      wins: 1,
      saves: 0,
      pitchingStrikeouts: 8,
      hitsAllowed: 5,
      walksIssued: 2,
      hitBatters: 1,
    });
  });

  it("treats null and missing counts as zero and missing innings as 0.0", () => {
    expect(mapHittingStat({ hits: null })).toMatchObject({ hits: 0, walks: 0 });
    expect(mapPitchingStat({})).toMatchObject({
      inningsPitched: "0.0",
      pitchingStrikeouts: 0,
    });
  });

  it("dispatches on group", () => {
    expect(mapStat("hitting", { hits: 1 })).toHaveProperty("hits", 1);
    expect(mapStat("pitching", { hits: 1 })).toHaveProperty("hitsAllowed", 1);
  });
});
