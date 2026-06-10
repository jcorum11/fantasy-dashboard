import { describe, expect, it } from "vitest";
import { DailyBreakdownService } from "@/src/application/services/DailyBreakdownService";
import {
  GAME_DATE,
  makeRepository,
  pick,
} from "@/src/application/services/DailyBreakdownService.mocks";

// Assumed contract (drives the implementation):
//   new DailyBreakdownService(repository)
//     .breakdown(gameDate, { goodStart = 15, bomb = 5 }?) -> DailyBreakdown
//
//   DailyBreakdown = {
//     gameDate: string,
//     pitchers: [{
//       pitcherName, team, opponent, isHome,
//       actualPoints: number | null,
//       status: "scored" | "pending" | "no-show",
//       calls: {            // one key PER RESOURCE THAT LISTED the pitcher
//         [resource]: { rank, tier, bucket, verdict } } | absent
//     }],                   // sorted by actualPoints DESC, nulls last
//     record: { [resource]: { wins, losses } },  // always all three
//   }
//
// Verdict rules (Jacob's call: PURE BUCKETING SKILL, both directions —
// "avoid bombs and pick hits", correct placement outweighs delivery):
//   - win  = high bucket + good start (>= goodStart)  [called the hit]
//          | low bucket + bomb (< bomb)               [called the avoid]
//   - loss = high bucket + bomb                       [sold you a dud]
//          | low bucket + good start                  [buried a gem]
//   - neutral = mid bucket, or outcomes between bomb and goodStart
//   - no verdict (null) when the pick is pending or no-show
// Buckets come from the shared per-day tercile assignment, per resource.

function service(picks: any[]) {
  return new DailyBreakdownService(makeRepository(picks));
}

describe("DailyBreakdownService", () => {
  it("joins the same pitcher's calls across resources into one row", async () => {
    const result = await service([
      pick({ pitcherName: "Chris Sale", resource: "dailywaivers", rank: 1, rawScore: 71, actualPoints: 27.9 }),
      pick({ pitcherName: "Chris Sale", resource: "pitcherlist", rank: 2, tier: "Auto-Starts", actualPoints: 27.9 }),
    ]).breakdown(GAME_DATE);

    expect(result.gameDate).toBe("2026-06-10");
    expect(result.pitchers).toHaveLength(1);

    const sale = result.pitchers[0];
    expect(sale.pitcherName).toBe("Chris Sale");
    expect(sale.actualPoints).toBe(27.9);
    expect(sale.status).toBe("scored");
    expect(sale.calls.dailywaivers).toMatchObject({ rank: 1, bucket: "high" });
    expect(sale.calls.pitcherlist).toMatchObject({
      rank: 2,
      tier: "Auto-Starts",
    });
    expect(sale.calls.fantasypros).toBeUndefined();
  });

  it("rewards correct bucket calls in both directions", async () => {
    const result = await service([
      pick({ pitcherName: "High Hit", rank: 1, actualPoints: 16 }),
      pick({ pitcherName: "Mid Guy", rank: 2, actualPoints: 22 }),
      pick({ pitcherName: "Low Bomb", rank: 3, actualPoints: -4 }),
    ]).breakdown(GAME_DATE);

    const verdicts = Object.fromEntries(
      result.pitchers.map((p) => [p.pitcherName, p.calls.dailywaivers?.verdict])
    );
    expect(verdicts["High Hit"]).toBe("win"); // called the hit
    expect(verdicts["Low Bomb"]).toBe("win"); // called the avoid
    expect(verdicts["Mid Guy"]).toBe("neutral"); // mid carries no claim
  });

  it("punishes wrong bucket calls in both directions", async () => {
    const result = await service([
      pick({ pitcherName: "High Bomb", rank: 1, actualPoints: 2 }),
      pick({ pitcherName: "Mid Bomb", rank: 2, actualPoints: 1 }),
      pick({ pitcherName: "Buried Gem", rank: 3, actualPoints: 22 }),
    ]).breakdown(GAME_DATE);

    const verdicts = Object.fromEntries(
      result.pitchers.map((p) => [p.pitcherName, p.calls.dailywaivers?.verdict])
    );
    expect(verdicts["High Bomb"]).toBe("loss"); // sold you a dud
    expect(verdicts["Buried Gem"]).toBe("loss"); // told you to avoid a hit
    expect(verdicts["Mid Bomb"]).toBe("neutral");
  });

  it("scores between bomb and goodStart as neutral even in the high bucket", async () => {
    const result = await service([
      pick({ pitcherName: "Meh Start", rank: 1, actualPoints: 10 }),
    ]).breakdown(GAME_DATE);

    expect(result.pitchers[0].calls.dailywaivers?.verdict).toBe("neutral");
  });

  it("gives no verdict for pending and no-show picks, with row status set", async () => {
    const result = await service([
      pick({ pitcherName: "Tonight Guy", rank: 1, pending: true }),
      pick({ pitcherName: "Scratched Guy", rank: 2, actualPoints: null }),
    ]).breakdown(GAME_DATE);

    const byName = Object.fromEntries(
      result.pitchers.map((p) => [p.pitcherName, p])
    );
    expect(byName["Tonight Guy"].status).toBe("pending");
    expect(byName["Tonight Guy"].calls.dailywaivers?.verdict).toBeNull();
    expect(byName["Scratched Guy"].status).toBe("no-show");
    expect(byName["Scratched Guy"].calls.dailywaivers?.verdict).toBeNull();
  });

  it("sorts rows by actual points descending with unscored last", async () => {
    const result = await service([
      pick({ pitcherName: "Pending", rank: 1, pending: true }),
      pick({ pitcherName: "Small", rank: 2, actualPoints: 4 }),
      pick({ pitcherName: "Big", rank: 3, actualPoints: 30 }),
    ]).breakdown(GAME_DATE);

    expect(result.pitchers.map((p) => p.pitcherName)).toEqual([
      "Big",
      "Small",
      "Pending",
    ]);
  });

  it("tallies each resource's day record from its own verdicts", async () => {
    const result = await service([
      // DW sold the dud high (loss); its ace sits mid (neutral)
      pick({ pitcherName: "Dud", resource: "dailywaivers", rank: 1, actualPoints: 1 }),
      pick({ pitcherName: "Ace", resource: "dailywaivers", rank: 2, actualPoints: 25 }),
      // PL: ace high (win), mid neutral, dud correctly buried low (win)
      pick({ pitcherName: "Ace", resource: "pitcherlist", rank: 1, actualPoints: 25 }),
      pick({ pitcherName: "Mid", resource: "pitcherlist", rank: 2, actualPoints: 10 }),
      pick({ pitcherName: "Dud", resource: "pitcherlist", rank: 3, actualPoints: 1 }),
    ]).breakdown(GAME_DATE);

    expect(result.record.dailywaivers).toEqual({ wins: 0, losses: 1 });
    expect(result.record.pitcherlist).toEqual({ wins: 2, losses: 0 });
    expect(result.record.fantasypros).toEqual({ wins: 0, losses: 0 });
  });

  it("applies custom thresholds", async () => {
    const result = await service([
      pick({ pitcherName: "Decent", rank: 1, actualPoints: 12 }),
    ]).breakdown(GAME_DATE, { goodStart: 12, bomb: 5 });

    expect(result.pitchers[0].calls.dailywaivers?.verdict).toBe("win");
  });
});
