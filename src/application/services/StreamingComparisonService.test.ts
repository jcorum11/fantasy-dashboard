import { describe, expect, it } from "vitest";
import { StreamingComparisonService } from "@/src/application/services/StreamingComparisonService";
import {
  makeRepository,
  makeRun,
  scoredPick,
} from "@/src/application/services/StreamingComparisonService.mocks";

// Assumed contract (drives the implementation):
//   new StreamingComparisonService(repository)
//     .compare(startDate, endDate) -> Promise<ComparisonReport>
//
//   ComparisonReport = {
//     startDate, endDate: string (YYYY-MM-DD)
//     resources: [{                       // ALWAYS all three, stable order:
//       resource,                          // fantasypros, pitcherlist, dailywaivers
//       coverage: { successDays, failedDays },        // from ingest_runs
//       overall: { picks, scored, unmatched, pending, avgPoints, hitRate },
//       byBucket: [{ bucket: high|mid|low, picks, scored, avgPoints, hitRate }],
//       byTier:   [{ tier, picks, scored, avgPoints, hitRate }],  // native tiers only
//     }]
//   }
//
// Contract decisions pinned below (adjust if you disagree):
//   - avgPoints averages ONLY non-null actualPoints ("didn't pitch" picks
//     are excluded, not zeros). avgPoints is null when nothing scored.
//   - hitRate = scored picks with actualPoints >= threshold (default 15,
//     compare()'s third arg) / scored picks; null when nothing scored.
//     Fraction 0..1 — the UI formats it as a percent.
//   - scored = actualPoints != null; unmatched = scoredAt set but points
//     null; pending = scoredAt null.
//   - Buckets are terciles BY RANK ORDER WITHIN each (resource, gameDate)
//     list, then aggregated across days — position/n < 1/3 high,
//     < 2/3 mid, else low. Null ranks sort last. A 1-pick day is high;
//     a 2-pick day is high + mid.
//   - byTier groups native tier labels only (null tiers omitted).
//   - Resources with no picks in range still appear with zeroed stats so
//     the UI can render an explicit empty/failed state.

const START = new Date("2026-06-01T00:00:00Z");
const END = new Date("2026-06-14T00:00:00Z");

function compare(picks: any[], runs: any[] = []) {
  return new StreamingComparisonService(makeRepository(picks, runs)).compare(
    START,
    END
  );
}

describe("StreamingComparisonService", () => {
  it("always lists all three resources in stable order, zeroed when empty", async () => {
    const report = await compare([]);

    expect(report.startDate).toBe("2026-06-01");
    expect(report.endDate).toBe("2026-06-14");
    expect(report.resources.map((r) => r.resource)).toEqual([
      "fantasypros",
      "pitcherlist",
      "dailywaivers",
    ]);
    for (const resource of report.resources) {
      expect(resource.overall).toEqual({
        picks: 0,
        scored: 0,
        unmatched: 0,
        pending: 0,
        avgPoints: null,
        hitRate: null,
      });
      expect(resource.byBucket).toEqual([]);
      expect(resource.byTier).toEqual([]);
    }
  });

  it("averages only non-null actual points and counts unmatched/pending", async () => {
    const report = await compare([
      scoredPick({ pitcherName: "A", rank: 1, actualPoints: 20 }),
      scoredPick({ pitcherName: "B", rank: 2, actualPoints: 10 }),
      scoredPick({ pitcherName: "C", rank: 3, actualPoints: null }), // didn't pitch
      scoredPick({ pitcherName: "D", rank: 4, pending: true }), // not yet scored
    ]);

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    expect(dw.overall).toEqual({
      picks: 4,
      scored: 2,
      unmatched: 1,
      pending: 1,
      avgPoints: 15,
      hitRate: 0.5, // 20 clears the default 15 bar; 10 does not
    });
  });

  it("buckets by rank terciles within each game date", async () => {
    const report = await compare([
      scoredPick({ pitcherName: "R1", rank: 1, actualPoints: 30 }),
      scoredPick({ pitcherName: "R2", rank: 2, actualPoints: 24 }),
      scoredPick({ pitcherName: "R3", rank: 3, actualPoints: 18 }),
      scoredPick({ pitcherName: "R4", rank: 4, actualPoints: 12 }),
      scoredPick({ pitcherName: "R5", rank: 5, actualPoints: 6 }),
      scoredPick({ pitcherName: "R6", rank: 6, actualPoints: 0 }),
    ]);

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    expect(dw.byBucket).toEqual([
      { bucket: "high", picks: 2, scored: 2, avgPoints: 27, hitRate: 1 },
      { bucket: "mid", picks: 2, scored: 2, avgPoints: 15, hitRate: 0.5 },
      { bucket: "low", picks: 2, scored: 2, avgPoints: 3, hitRate: 0 },
    ]);
  });

  it("buckets each game date independently before aggregating", async () => {
    const day2 = new Date("2026-06-11T00:00:00Z");
    const report = await compare([
      // day 1: three picks -> one per bucket
      scoredPick({ pitcherName: "A1", rank: 1, actualPoints: 30 }),
      scoredPick({ pitcherName: "A2", rank: 2, actualPoints: 15 }),
      scoredPick({ pitcherName: "A3", rank: 3, actualPoints: 0 }),
      // day 2: a single pick is that day's high — NOT pooled with day 1 ranks
      scoredPick({ pitcherName: "B1", rank: 9, gameDate: day2, actualPoints: 10 }),
    ]);

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    expect(dw.byBucket).toEqual([
      { bucket: "high", picks: 2, scored: 2, avgPoints: 20, hitRate: 0.5 },
      { bucket: "mid", picks: 1, scored: 1, avgPoints: 15, hitRate: 1 },
      { bucket: "low", picks: 1, scored: 1, avgPoints: 0, hitRate: 0 },
    ]);
  });

  it("keeps resources separate when bucketing shared game dates", async () => {
    const report = await compare([
      scoredPick({ pitcherName: "DW1", rank: 1, actualPoints: 20 }),
      scoredPick({ pitcherName: "PL1", resource: "pitcherlist", rank: 1, tier: "Auto-Starts", actualPoints: 8 }),
    ]);

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    const pl = report.resources.find((r) => r.resource === "pitcherlist")!;
    expect(dw.byBucket).toEqual([
      { bucket: "high", picks: 1, scored: 1, avgPoints: 20, hitRate: 1 },
    ]);
    expect(pl.byBucket).toEqual([
      { bucket: "high", picks: 1, scored: 1, avgPoints: 8, hitRate: 0 },
    ]);
  });

  it("aggregates native tiers, omitting untiered picks", async () => {
    const report = await compare([
      scoredPick({ pitcherName: "P1", resource: "pitcherlist", rank: 1, tier: "Auto-Starts", actualPoints: 25 }),
      scoredPick({ pitcherName: "P2", resource: "pitcherlist", rank: 2, tier: "Auto-Starts", actualPoints: 15 }),
      scoredPick({ pitcherName: "P3", resource: "pitcherlist", rank: 3, tier: "Probably Starts", actualPoints: 5 }),
      scoredPick({ pitcherName: "D1", rank: 1, actualPoints: 12 }), // dailywaivers, no tier
    ]);

    const pl = report.resources.find((r) => r.resource === "pitcherlist")!;
    expect(pl.byTier).toEqual([
      { tier: "Auto-Starts", picks: 2, scored: 2, avgPoints: 20, hitRate: 1 },
      { tier: "Probably Starts", picks: 1, scored: 1, avgPoints: 5, hitRate: 0 },
    ]);

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    expect(dw.byTier).toEqual([]);
  });

  it("reports per-resource ingest coverage from ingest_runs", async () => {
    const report = await compare(
      [],
      [
        makeRun({ resource: "fantasypros", status: "failure", error: "403" }),
        makeRun({ resource: "fantasypros", runDate: new Date("2026-06-11T00:00:00Z"), status: "success" }),
        makeRun({ resource: "dailywaivers", status: "success" }),
      ]
    );

    const fp = report.resources.find((r) => r.resource === "fantasypros")!;
    expect(fp.coverage).toEqual({ successDays: 1, failedDays: 1 });

    const pl = report.resources.find((r) => r.resource === "pitcherlist")!;
    expect(pl.coverage).toEqual({ successDays: 0, failedDays: 0 });
  });

  it("applies a custom threshold to hit rates", async () => {
    const repository = makeRepository(
      [
        scoredPick({ pitcherName: "A", rank: 1, actualPoints: 12 }),
        scoredPick({ pitcherName: "B", rank: 2, actualPoints: 9 }),
      ],
      []
    );
    const report = await new StreamingComparisonService(repository).compare(
      START,
      END,
      10
    );

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    expect(dw.overall.hitRate).toBe(0.5); // 12 clears 10; 9 does not
  });

  it("sorts null ranks last within a day's bucket order", async () => {
    const report = await compare([
      scoredPick({ pitcherName: "Ranked", rank: 1, actualPoints: 20 }),
      scoredPick({ pitcherName: "Unranked", rank: null, actualPoints: 4 }),
    ]);

    const dw = report.resources.find((r) => r.resource === "dailywaivers")!;
    expect(dw.byBucket).toEqual([
      { bucket: "high", picks: 1, scored: 1, avgPoints: 20, hitRate: 1 },
      { bucket: "mid", picks: 1, scored: 1, avgPoints: 4, hitRate: 0 },
    ]);
  });
});
