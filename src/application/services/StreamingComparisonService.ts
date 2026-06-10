import { IngestRun } from "@/src/domain/models/IngestRun";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import {
  STREAMING_RESOURCES,
  StreamingResource,
} from "@/src/domain/models/StreamingResource";
import {
  assignBuckets,
  BUCKET_ORDER,
  RankBucket,
} from "@/src/application/services/rankBuckets";

export type { RankBucket } from "@/src/application/services/rankBuckets";

export interface ComparisonRepository {
  findByGameDateRange(
    startDate: Date,
    endDate: Date,
    resource?: StreamingResource
  ): Promise<StreamingPick[]>;
  findIngestRuns(startDate: Date, endDate: Date): Promise<IngestRun[]>;
}

export interface SegmentStats {
  picks: number;
  scored: number;
  avgPoints: number | null;
  /** Fraction of scored picks with actualPoints >= threshold; null when nothing scored. */
  hitRate: number | null;
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

function segmentStats(
  picks: StreamingPick[],
  threshold: number
): SegmentStats {
  const scored = picks.filter((p) => p.actualPoints !== null);
  return {
    picks: picks.length,
    scored: scored.length,
    avgPoints:
      scored.length === 0
        ? null
        : scored.reduce((sum, p) => sum + (p.actualPoints as number), 0) /
          scored.length,
    hitRate:
      scored.length === 0
        ? null
        : scored.filter((p) => (p.actualPoints as number) >= threshold)
            .length / scored.length,
  };
}

export class StreamingComparisonService {
  constructor(private readonly repository: ComparisonRepository) {}

  public async compare(
    startDate: Date,
    endDate: Date,
    threshold: number = 15
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
          runs.filter((r) => r.resource === resource),
          threshold
        )
      ),
    };
  }

  private compareResource(
    resource: StreamingResource,
    picks: StreamingPick[],
    runs: IngestRun[],
    threshold: number
  ): ResourceComparison {
    return {
      resource,
      coverage: {
        successDays: runs.filter((r) => r.status === "success").length,
        failedDays: runs.filter((r) => r.status === "failure").length,
      },
      overall: {
        ...segmentStats(picks, threshold),
        unmatched: picks.filter(
          (p) => p.scoredAt !== null && p.actualPoints === null
        ).length,
        pending: picks.filter((p) => p.scoredAt === null).length,
      },
      byBucket: this.aggregateBuckets(picks, threshold),
      byTier: this.aggregateTiers(picks, threshold),
    };
  }

  /** Buckets via the shared per-day tercile assignment (rankBuckets.ts). */
  private aggregateBuckets(
    picks: StreamingPick[],
    threshold: number
  ): Array<SegmentStats & { bucket: RankBucket }> {
    const byBucket = new Map<RankBucket, StreamingPick[]>();
    for (const { pick, bucket } of assignBuckets(picks)) {
      byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), pick]);
    }

    return BUCKET_ORDER.filter((bucket) => byBucket.has(bucket)).map(
      (bucket) => ({
        bucket,
        ...segmentStats(byBucket.get(bucket)!, threshold),
      })
    );
  }

  /** Native tier labels in first-appearance order; untiered picks omitted. */
  private aggregateTiers(
    picks: StreamingPick[],
    threshold: number
  ): Array<SegmentStats & { tier: string }> {
    const byTier = new Map<string, StreamingPick[]>();
    for (const pick of picks) {
      if (pick.tier === null) continue;
      byTier.set(pick.tier, [...(byTier.get(pick.tier) ?? []), pick]);
    }

    return [...byTier.entries()].map(([tier, tierPicks]) => ({
      tier,
      ...segmentStats(tierPicks, threshold),
    }));
  }
}
