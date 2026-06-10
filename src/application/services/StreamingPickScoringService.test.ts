import { describe, expect, it } from "vitest";
import { StreamingPickScoringService } from "@/src/application/services/StreamingPickScoringService";
import {
  GAME_DATE,
  makePick,
  makePlayerStats,
  makeRepository,
  makeStatsProvider,
} from "@/src/application/services/StreamingPickScoringService.mocks";

// Assumed contract (drives the implementation):
//   new StreamingPickScoringService(statsProvider, repository)
//     .scoreGameDate(gameDate) -> Promise<ScoringSummary>
//
//   statsProvider = PlayerStatsService-shaped:
//     getPlayerStatsByDate(date: string, platform: "yahoo") -> PlayerStats[]
//
//   ScoringSummary = {
//     gameDate: string;          // YYYY-MM-DD
//     scored: number;            // picks whose pitcher pitched -> points written
//     unmatched: string[];       // pick names with no pitching appearance
//   }
//
// Contract decisions pinned below (adjust if you disagree):
//   - Matching is accent/case-insensitive (normalizeName) and only against
//     players who actually PITCHED (inningsPitched > 0) — a same-named
//     position player can't satisfy a pick.
//   - Ambiguous duplicate names: the pick's team breaks the tie; without a
//     team the pick is conservatively unmatched.
//   - Unmatched picks get updateActualPoints(..., null) — "scored, didn't
//     pitch" — so they're excluded from averages rather than counted as 0.

function service(picks: any[], stats: any[]) {
  const repository = makeRepository(picks);
  const statsProvider = makeStatsProvider(stats);
  return {
    repository,
    statsProvider,
    scoring: new StreamingPickScoringService(statsProvider, repository),
  };
}

describe("StreamingPickScoringService", () => {
  it("writes actual Yahoo points for a matched pick", async () => {
    const { repository, scoring } = service(
      [makePick("Mitch Keller")],
      [makePlayerStats("Mitch Keller", { points: 23.4 })]
    );

    const summary = await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "Mitch Keller",
      23.4
    );
    expect(summary).toEqual({
      gameDate: "2026-06-10",
      scored: 1,
      unmatched: [],
    });
  });

  it("requests stats for the right date and platform", async () => {
    const { statsProvider, scoring } = service(
      [makePick("Mitch Keller")],
      [makePlayerStats("Mitch Keller")]
    );

    await scoring.scoreGameDate(GAME_DATE);

    expect(statsProvider.getPlayerStatsByDate).toHaveBeenCalledWith(
      "2026-06-10",
      "yahoo"
    );
  });

  it("matches names across accents and case", async () => {
    const { repository, scoring } = service(
      [makePick("jesus luzardo")],
      [makePlayerStats("Jesús Luzardo", { points: 18.1 })]
    );

    await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "jesus luzardo",
      18.1
    );
  });

  it("ignores same-named players who did not pitch", async () => {
    const { repository, scoring } = service(
      [makePick("Will Smith")],
      [
        makePlayerStats("Will Smith", {
          position: "C",
          inningsPitched: 0,
          points: 31,
        }),
      ]
    );

    const summary = await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "Will Smith",
      null
    );
    expect(summary.unmatched).toEqual(["Will Smith"]);
  });

  it("breaks duplicate-name ties with the pick's team", async () => {
    const { repository, scoring } = service(
      [makePick("Logan Allen", { team: "CLE" })],
      [
        makePlayerStats("Logan Allen", { team: "CLE", points: 12 }),
        makePlayerStats("Logan Allen", { team: "SDP", points: 4 }),
      ]
    );

    await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "Logan Allen",
      12
    );
  });

  it("leaves duplicate names without a team conservatively unmatched", async () => {
    const { repository, scoring } = service(
      [makePick("Logan Allen", { team: null })],
      [
        makePlayerStats("Logan Allen", { team: "CLE", points: 12 }),
        makePlayerStats("Logan Allen", { team: "SDP", points: 4 }),
      ]
    );

    const summary = await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "Logan Allen",
      null
    );
    expect(summary.unmatched).toEqual(["Logan Allen"]);
  });

  it("scores the same pitcher independently for each resource", async () => {
    const { repository, scoring } = service(
      [
        makePick("Chris Sale", { resource: "dailywaivers" }),
        makePick("Chris Sale", { resource: "pitcherlist" }),
      ],
      [makePlayerStats("Chris Sale", { points: 27.9 })]
    );

    const summary = await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "Chris Sale",
      27.9
    );
    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "pitcherlist",
      GAME_DATE,
      "Chris Sale",
      27.9
    );
    expect(summary.scored).toBe(2);
  });

  it("records a scratch (no appearance at all) as unmatched with null points", async () => {
    const { repository, scoring } = service(
      [makePick("Scratched Starter")],
      [makePlayerStats("Somebody Else")]
    );

    const summary = await scoring.scoreGameDate(GAME_DATE);

    expect(repository.updateActualPoints).toHaveBeenCalledWith(
      "dailywaivers",
      GAME_DATE,
      "Scratched Starter",
      null
    );
    expect(summary).toEqual({
      gameDate: "2026-06-10",
      scored: 0,
      unmatched: ["Scratched Starter"],
    });
  });

  it("does nothing when the date has no picks", async () => {
    const { repository, statsProvider, scoring } = service([], []);

    const summary = await scoring.scoreGameDate(GAME_DATE);

    expect(statsProvider.getPlayerStatsByDate).not.toHaveBeenCalled();
    expect(repository.updateActualPoints).not.toHaveBeenCalled();
    expect(summary).toEqual({ gameDate: "2026-06-10", scored: 0, unmatched: [] });
  });
});
