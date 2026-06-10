import { StreamingPick } from "@/src/domain/models/StreamingPick";
import {
  STREAMING_RESOURCES,
  StreamingResource,
} from "@/src/domain/models/StreamingResource";
import {
  assignBuckets,
  RankBucket,
} from "@/src/application/services/rankBuckets";

export interface DailyBreakdownRepository {
  findByGameDateRange(
    startDate: Date,
    endDate: Date,
    resource?: StreamingResource
  ): Promise<StreamingPick[]>;
}

export type Verdict = "win" | "loss" | "neutral";

export interface ResourceCall {
  rank: number | null;
  tier: string | null;
  bucket: RankBucket;
  verdict: Verdict | null;
}

export interface PitcherDay {
  pitcherName: string;
  team: string | null;
  opponent: string | null;
  isHome: boolean | null;
  actualPoints: number | null;
  status: "scored" | "pending" | "no-show";
  calls: Partial<Record<StreamingResource, ResourceCall>>;
}

export interface DailyBreakdown {
  gameDate: string;
  pitchers: PitcherDay[];
  record: Record<StreamingResource, { wins: number; losses: number }>;
}

export interface VerdictThresholds {
  goodStart: number;
  bomb: number;
}

export class DailyBreakdownService {
  constructor(private readonly repository: DailyBreakdownRepository) {}

  public async breakdown(
    gameDate: Date,
    thresholds: Partial<VerdictThresholds> = {}
  ): Promise<DailyBreakdown> {
    const { goodStart = 15, bomb = 5 } = thresholds;
    const picks = await this.repository.findByGameDateRange(
      gameDate,
      gameDate
    );

    // Buckets are per resource (each ranks its own list for the day)
    const bucketByPick = new Map<StreamingPick, RankBucket>();
    for (const resource of STREAMING_RESOURCES) {
      const assigned = assignBuckets(
        picks.filter((p) => p.resource === resource)
      );
      for (const { pick, bucket } of assigned) {
        bucketByPick.set(pick, bucket);
      }
    }

    const rows = new Map<string, PitcherDay>();
    const record = Object.fromEntries(
      STREAMING_RESOURCES.map((r) => [r, { wins: 0, losses: 0 }])
    ) as DailyBreakdown["record"];

    for (const pick of picks) {
      const row = rows.get(pick.pitcherName) ?? {
        pitcherName: pick.pitcherName,
        team: null,
        opponent: null,
        isHome: null,
        actualPoints: null,
        status: "pending" as const,
        calls: {},
      };
      // Pitcher List doesn't carry team/opponent — first resource that does wins
      row.team ??= pick.team;
      row.opponent ??= pick.opponent;
      row.isHome ??= pick.isHome;
      if (pick.actualPoints !== null) row.actualPoints = pick.actualPoints;

      const bucket = bucketByPick.get(pick)!;
      const verdict = this.verdictFor(pick, bucket, goodStart, bomb);
      if (verdict === "win") record[pick.resource].wins++;
      if (verdict === "loss") record[pick.resource].losses++;

      row.calls[pick.resource] = {
        rank: pick.rank,
        tier: pick.tier,
        bucket,
        verdict,
      };
      rows.set(pick.pitcherName, row);
    }

    for (const row of rows.values()) {
      if (row.actualPoints !== null) {
        row.status = "scored";
      } else {
        const scoredAttempted = picks.some(
          (p) => p.pitcherName === row.pitcherName && p.scoredAt !== null
        );
        row.status = scoredAttempted ? "no-show" : "pending";
      }
    }

    const pitchers = [...rows.values()].sort((a, b) => {
      if (a.actualPoints === null && b.actualPoints === null) {
        return a.pitcherName.localeCompare(b.pitcherName);
      }
      if (a.actualPoints === null) return 1;
      if (b.actualPoints === null) return -1;
      return b.actualPoints - a.actualPoints;
    });

    return {
      gameDate: gameDate.toISOString().split("T")[0],
      pitchers,
      record,
    };
  }

  /**
   * Pure bucketing skill, both directions ("avoid bombs and pick hits"):
   * correct calls win, wrong calls lose, no-claim picks stay neutral.
   * The claim graded is the resource's NATIVE one — Pitcher List's tier
   * (Questionable is "if you're desperate", an avoid) rather than the
   * tercile position, which can misread short-tier days (the 6/9 Cease/
   * May case). Untiered resources are graded on their tercile bucket.
   */
  private verdictFor(
    pick: StreamingPick,
    bucket: RankBucket,
    goodStart: number,
    bomb: number
  ): Verdict | null {
    if (pick.actualPoints === null) return null;

    const claim = this.claimFor(pick.tier, bucket);
    if (claim === null) return "neutral";

    const hit = pick.actualPoints >= goodStart;
    const bombed = pick.actualPoints < bomb;
    if (claim === "start" && hit) return "win";
    if (claim === "start" && bombed) return "loss";
    if (claim === "avoid" && bombed) return "win";
    if (claim === "avoid" && hit) return "loss";
    return "neutral";
  }

  private claimFor(
    tier: string | null,
    bucket: RankBucket
  ): "start" | "avoid" | null {
    if (tier !== null) {
      const label = tier.toLowerCase();
      if (label.startsWith("auto-start") || label.startsWith("probably start")) {
        return "start";
      }
      if (
        label.startsWith("questionable start") ||
        label.startsWith("do not start")
      ) {
        return "avoid";
      }
      // unknown tier label — fall through to the tercile bucket
    }
    if (bucket === "high") return "start";
    if (bucket === "low") return "avoid";
    return null;
  }
}
