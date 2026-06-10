import { describe, expect, it } from "vitest";
import { assignBuckets } from "@/src/application/services/rankBuckets";
import { StreamingPick } from "@/src/domain/models/StreamingPick";

// Assumed contract (extracted from StreamingComparisonService, which keeps
// its behavior — its tests double as a regression net for this refactor):
//   assignBuckets(picks) -> Array<{ pick, bucket: "high"|"mid"|"low" }>
//   - Terciles by rank order WITHIN each gameDate's list (one resource's
//     picks at a time; the caller filters): position/n < 1/3 high,
//     < 2/3 mid, else low.
//   - Null ranks sort last; rank ties break by pitcher name ASC.
//   - Each game date is bucketed independently (a 1-pick day is "high").

function pick(
  pitcherName: string,
  rank: number | null,
  gameDate = "2026-06-10"
): StreamingPick {
  return StreamingPick.create({
    resource: "dailywaivers",
    pitcherName,
    gameDate: new Date(`${gameDate}T00:00:00Z`),
    pickDate: new Date(`${gameDate}T00:00:00Z`),
    rank,
  });
}

function byName(assigned: Array<{ pick: StreamingPick; bucket: string }>) {
  return Object.fromEntries(
    assigned.map(({ pick, bucket }) => [pick.pitcherName, bucket])
  );
}

describe("assignBuckets", () => {
  it("splits a day into rank terciles", () => {
    const assigned = assignBuckets([
      pick("R1", 1),
      pick("R2", 2),
      pick("R3", 3),
      pick("R4", 4),
      pick("R5", 5),
      pick("R6", 6),
    ]);

    expect(byName(assigned)).toEqual({
      R1: "high",
      R2: "high",
      R3: "mid",
      R4: "mid",
      R5: "low",
      R6: "low",
    });
  });

  it("buckets each game date independently", () => {
    const assigned = assignBuckets([
      pick("A1", 1),
      pick("A2", 2),
      pick("A3", 3),
      pick("B1", 9, "2026-06-11"), // alone on its day -> high
    ]);

    expect(byName(assigned)).toEqual({
      A1: "high",
      A2: "mid",
      A3: "low",
      B1: "high",
    });
  });

  it("sorts null ranks last and breaks rank ties by name", () => {
    const assigned = assignBuckets([
      pick("Unranked", null),
      pick("Zed", 1),
      pick("Abe", 1),
    ]);

    expect(byName(assigned)).toEqual({
      Abe: "high",
      Zed: "mid",
      Unranked: "low",
    });
  });

  it("returns an empty array for no picks", () => {
    expect(assignBuckets([])).toEqual([]);
  });
});
