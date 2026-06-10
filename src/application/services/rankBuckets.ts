import { StreamingPick } from "@/src/domain/models/StreamingPick";

export type RankBucket = "high" | "mid" | "low";

export const BUCKET_ORDER: RankBucket[] = ["high", "mid", "low"];

/** Tercile by position within one day's rank-ordered list. */
function bucketFor(index: number, total: number): RankBucket {
  const position = index / total;
  if (position < 1 / 3) return "high";
  if (position < 2 / 3) return "mid";
  return "low";
}

/**
 * Assigns each pick a high/mid/low bucket: terciles by rank order WITHIN
 * its game date's list (a sparse day's #1 is that day's "high" — never
 * pooled across days). Pass one resource's picks at a time.
 */
export function assignBuckets(
  picks: StreamingPick[]
): Array<{ pick: StreamingPick; bucket: RankBucket }> {
  const byDay = new Map<string, StreamingPick[]>();
  for (const pick of picks) {
    const day = pick.gameDate.toISOString();
    byDay.set(day, [...(byDay.get(day) ?? []), pick]);
  }

  const assigned: Array<{ pick: StreamingPick; bucket: RankBucket }> = [];
  for (const day of byDay.values()) {
    day.sort((a, b) => {
      if (a.rank !== b.rank) {
        return (a.rank ?? Infinity) - (b.rank ?? Infinity);
      }
      return a.pitcherName.localeCompare(b.pitcherName);
    });
    day.forEach((pick, index) => {
      assigned.push({ pick, bucket: bucketFor(index, day.length) });
    });
  }

  return assigned;
}
