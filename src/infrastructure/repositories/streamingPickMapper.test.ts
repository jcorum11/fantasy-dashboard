import { describe, expect, it } from "vitest";
import { rowToStreamingPick } from "@/src/infrastructure/repositories/streamingPickMapper";
import { buildPickRow } from "@/src/infrastructure/repositories/streamingPickMapper.mocks";

describe("rowToStreamingPick", () => {
  it("maps a full row to a StreamingPick", () => {
    const pick = rowToStreamingPick(buildPickRow());

    expect(pick.resource).toBe("fantasypros");
    expect(pick.pitcherName).toBe("Shohei Ohtani");
    expect(pick.mlbPlayerId).toBe(660271);
    expect(pick.team).toBe("LAD");
    expect(pick.opponent).toBe("PIT");
    expect(pick.isHome).toBe(false);
    expect(pick.rank).toBe(1);
    expect(pick.tier).toBeNull();
    expect(pick.rawScore).toBeNull();
  });

  it("parses DATE columns as UTC midnight, not local time", () => {
    const pick = rowToStreamingPick(buildPickRow());

    expect(pick.gameDate.toISOString()).toBe("2026-06-10T00:00:00.000Z");
    expect(pick.pickDate.toISOString()).toBe("2026-06-10T00:00:00.000Z");
  });

  it("coerces NUMERIC raw_score returned as a string to a number", () => {
    const pick = rowToStreamingPick(buildPickRow({ raw_score: "78.50" }));
    expect(pick.rawScore).toBe(78.5);
  });

  it("preserves null optional fields", () => {
    const pick = rowToStreamingPick(
      buildPickRow({
        mlb_player_id: null,
        team: null,
        opponent: null,
        is_home: null,
        rank: null,
        tier: null,
        raw_score: null,
      })
    );

    expect(pick.mlbPlayerId).toBeNull();
    expect(pick.team).toBeNull();
    expect(pick.opponent).toBeNull();
    expect(pick.isHome).toBeNull();
    expect(pick.rank).toBeNull();
    expect(pick.rawScore).toBeNull();
  });

  it("maps scoring columns: actual_points and scored_at", () => {
    const scored = rowToStreamingPick(
      buildPickRow({
        actual_points: 23.4,
        scored_at: "2026-06-11T17:00:00.000Z",
      })
    );
    expect(scored.actualPoints).toBe(23.4);
    expect(scored.scoredAt?.toISOString()).toBe("2026-06-11T17:00:00.000Z");

    const pending = rowToStreamingPick(
      buildPickRow({ actual_points: null, scored_at: null })
    );
    expect(pending.actualPoints).toBeNull();
    expect(pending.scoredAt).toBeNull();
  });

  it("maps a tiered Pitcher List row", () => {
    const pick = rowToStreamingPick(
      buildPickRow({
        resource: "pitcherlist",
        pitcher_name: "Paul Skenes",
        tier: "Auto-Starts",
        rank: 1,
        raw_score: null,
      })
    );

    expect(pick.tier).toBe("Auto-Starts");
  });

  it("throws on a row with an unknown resource rather than constructing a corrupt pick", () => {
    expect(() =>
      rowToStreamingPick(buildPickRow({ resource: "espn" }))
    ).toThrow(/resource/i);
  });
});
