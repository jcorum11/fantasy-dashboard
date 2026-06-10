import { describe, expect, it } from "vitest";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { buildPickProps } from "@/src/domain/models/StreamingPick.mocks";

describe("StreamingPick", () => {
  describe("create", () => {
    it("creates a pick with all fields", () => {
      const pick = StreamingPick.create(buildPickProps());

      expect(pick.resource).toBe("dailywaivers");
      expect(pick.pitcherName).toBe("Mitch Keller");
      expect(pick.mlbPlayerId).toBe(656605);
      expect(pick.team).toBe("PIT");
      expect(pick.opponent).toBe("MIA");
      expect(pick.isHome).toBe(true);
      expect(pick.rank).toBe(4);
      expect(pick.tier).toBeNull();
      expect(pick.rawScore).toBe(78.5);
      expect(pick.gameDate.toISOString()).toBe("2026-06-10T00:00:00.000Z");
      expect(pick.pickDate.toISOString()).toBe("2026-06-09T00:00:00.000Z");
    });

    it("carries scoring fields when provided and defaults them to null", () => {
      const unscored = StreamingPick.create(buildPickProps());
      expect(unscored.actualPoints).toBeNull();
      expect(unscored.scoredAt).toBeNull();

      const scoredAt = new Date("2026-06-11T17:00:00Z");
      const scored = StreamingPick.create(
        buildPickProps({ actualPoints: 23.4, scoredAt })
      );
      expect(scored.actualPoints).toBe(23.4);
      expect(scored.scoredAt).toBe(scoredAt);
    });

    it("defaults omitted optional fields to null", () => {
      const pick = StreamingPick.create({
        resource: "pitcherlist",
        pitcherName: "Paul Skenes",
        gameDate: new Date("2026-06-10T00:00:00Z"),
        pickDate: new Date("2026-06-10T00:00:00Z"),
      });

      expect(pick.mlbPlayerId).toBeNull();
      expect(pick.team).toBeNull();
      expect(pick.opponent).toBeNull();
      expect(pick.isHome).toBeNull();
      expect(pick.rank).toBeNull();
      expect(pick.tier).toBeNull();
      expect(pick.rawScore).toBeNull();
    });

    it("trims surrounding whitespace from pitcher name", () => {
      // Pitcher List markup leaves trailing spaces inside <strong> tags
      const pick = StreamingPick.create(
        buildPickProps({ pitcherName: " Paul Skenes " })
      );
      expect(pick.pitcherName).toBe("Paul Skenes");
    });

    it.each(["", "   "])(
      "throws when pitcher name is empty or whitespace (%j)",
      (pitcherName) => {
        expect(() =>
          StreamingPick.create(buildPickProps({ pitcherName }))
        ).toThrow(/pitcher name/i);
      }
    );

    it("throws on an unknown resource", () => {
      expect(() =>
        StreamingPick.create(
          buildPickProps({ resource: "rotowire" as never })
        )
      ).toThrow(/resource/i);
    });

    it.each([0, -1, 2.5])("throws on invalid rank %p", (rank) => {
      expect(() => StreamingPick.create(buildPickProps({ rank }))).toThrow(
        /rank/i
      );
    });

    it("throws on an invalid game date", () => {
      expect(() =>
        StreamingPick.create(buildPickProps({ gameDate: new Date("nope") }))
      ).toThrow(/game date/i);
    });

    it("throws on an invalid pick date", () => {
      expect(() =>
        StreamingPick.create(buildPickProps({ pickDate: new Date("nope") }))
      ).toThrow(/pick date/i);
    });
  });

  describe("toJSON", () => {
    it("serializes dates as YYYY-MM-DD and includes all fields", () => {
      expect(StreamingPick.create(buildPickProps()).toJSON()).toEqual({
        resource: "dailywaivers",
        pitcherName: "Mitch Keller",
        gameDate: "2026-06-10",
        pickDate: "2026-06-09",
        mlbPlayerId: 656605,
        team: "PIT",
        opponent: "MIA",
        isHome: true,
        rank: 4,
        tier: null,
        rawScore: 78.5,
        appearance: 1,
        actualPoints: null,
        scoredAt: null,
      });
    });
  });
});
