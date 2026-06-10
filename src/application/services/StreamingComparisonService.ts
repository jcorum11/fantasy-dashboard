import { IngestRun } from "@/src/domain/models/IngestRun";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import {
  STREAMING_RESOURCES,
  StreamingResource,
} from "@/src/domain/models/StreamingResource";

export interface ComparisonRepository {
  findByGameDateRange(
    startDate: Date,
    endDate: Date,
    resource?: StreamingResource
  ): Promise<StreamingPick[]>;
  findIngestRuns(startDate: Date, endDate: Date): Promise<IngestRun[]>;
}

export type RankBucket = "high" | "mid" | "low";

export interface SegmentStats {
  picks: number;
  scored: number;
  avgPoints: number | null;
}

export interface ResourceComparison {
  resource: StreamingResource;
  coverage: { successDays: number; failedDays: number };
  overall: SegmentStats & { unmatched: number; pending: number };
  byBucket: Array<SegmentStats & { bucket: RankBucket }>;
  byTier: Array<SegmentStats & { tier: string }>;
}

export interface ComparisonReport {
  startDate: string;
  endDate: string;
  resources: ResourceComparison[];
}

const BUCKET_ORDER: RankBucket[] = ["high", "mid", "low"];

function segmentStats(picks: StreamingPick[]): SegmentStats {
  const scored = picks.filter((p) => p.actualPoints !== null);
  return {
    picks: picks.length,
    scored: scored.length,
    avgPoints:
      scored.length === 0
        ? null
        : scored.reduce((sum, p) => sum + (p.actualPoints as number), 0) /
          scored.length,
  };
}

/** Tercile by position within one day's rank-ordered list. */
function bucketFor(index: number, total: number): RankBucket {
  const position = index / total;
  if (position < 1 / 3) return "high";
  if (position < 2 / 3) return "mid";
  return "low";
}

export class StreamingComparisonService {
  constructor(private readonly repository: ComparisonRepository) {}

  public async compare(
    startDate: Date,
    endDate: Date
  ): Promise<ComparisonReport> {
    const [picks, runs] = await Promise.all([
      this.repository.findByGameDateRange(startDate, endDate),
      this.repository.findIngestRuns(startDate, endDate),
    ]);

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      resources: STREAMING_RESOURCES.map((resource) =>
        this.compareResource(
          resource,
          picks.filter((p) => p.resource === resource),
          runs.filter((r) => r.resource === resource)
        )
      ),
    };
  }

  private compareResource(
    resource: StreamingResource,
    picks: StreamingPick[],
    runs: IngestRun[]
  ): ResourceComparison {
    return {
      resource,
      coverage: {
        successDays: runs.filter((r) => r.status === "success").length,
        failedDays: runs.filter((r) => r.status === "failure").length,
      },
      overall: {
        ...segmentStats(picks),
        unmatched: picks.filter(
          (p) => p.scoredAt !== null && p.actualPoints === null
        ).length,
        pending: picks.filter((p) => p.scoredAt === null).length,
      },
      byBucket: this.aggregateBuckets(picks),
      byTier: this.aggregateTiers(picks),
    };
  }

  /**
   * Buckets are terciles by rank order WITHIN each game date's list (a
   * sparse day's #1 is that day's "high" — never pooled across days), then
   * aggregated across the range.
   */
  private aggregateBuckets(
    picks: StreamingPick[]
  ): Array<SegmentStats & { bucket: RankBucket }> {
    const byDay = new Map<string, StreamingPick[]>();
    for (const pick of picks) {
      const day = pick.gameDate.toISOString();
      byDay.set(day, [...(byDay.get(day) ?? []), pick]);
    }

    const byBucket = new Map<RankBucket, StreamingPick[]>();
    for (const day of byDay.values()) {
      day.sort((a, b) => {
        if (a.rank !== b.rank) {
          return (a.rank ?? Infinity) - (b.rank ?? Infinity);
        }
        return a.pitcherName.localeCompare(b.pitcherName);
      });
      day.forEach((pick, index) => {
        const bucket = bucketFor(index, day.length);
        byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), pick]);
      });
    }

    return BUCKET_ORDER.filter((bucket) => byBucket.has(bucket)).map(
      (bucket) => ({
        bucket,
        ...segmentStats(byBucket.get(bucket)!),
      })
    );
  }

  /** Native tier labels in first-appearance order; untiered picks omitted. */
  private aggregateTiers(
    picks: StreamingPick[]
  ): Array<SegmentStats & { tier: string }> {
    const byTier = new Map<string, StreamingPick[]>();
    for (const pick of picks) {
      if (pick.tier === null) continue;
      byTier.set(pick.tier, [...(byTier.get(pick.tier) ?? []), pick]);
    }

    return [...byTier.entries()].map(([tier, tierPicks]) => ({
      tier,
      ...segmentStats(tierPicks),
    }));
  }
}
