import { normalizeName } from "@/lib/processing/rosterEnrichment";
import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { StreamingResource } from "@/src/domain/models/StreamingResource";

export interface PitcherStatsProvider {
  getPlayerStatsByDate(
    date: string,
    platform: "yahoo"
  ): Promise<PlayerStats[]>;
}

export interface ScoringRepository {
  findByGameDateRange(
    startDate: Date,
    endDate: Date,
    resource?: StreamingResource
  ): Promise<StreamingPick[]>;
  updateActualPoints(
    resource: StreamingResource,
    gameDate: Date,
    pitcherName: string,
    actualPoints: number | null
  ): Promise<void>;
}

export interface ScoringSummary {
  gameDate: string;
  scored: number;
  unmatched: string[];
}

export class StreamingPickScoringService {
  constructor(
    private readonly statsProvider: PitcherStatsProvider,
    private readonly repository: ScoringRepository
  ) {}

  public async scoreGameDate(gameDate: Date): Promise<ScoringSummary> {
    const dateString = gameDate.toISOString().split("T")[0];
    const picks = await this.repository.findByGameDateRange(
      gameDate,
      gameDate
    );
    if (picks.length === 0) {
      return { gameDate: dateString, scored: 0, unmatched: [] };
    }

    const stats = await this.statsProvider.getPlayerStatsByDate(
      dateString,
      "yahoo"
    );
    const pitched = stats.filter((s) => s.pitchingStats.inningsPitched > 0);

    const byName = new Map<string, PlayerStats[]>();
    for (const player of pitched) {
      const key = normalizeName(player.name);
      byName.set(key, [...(byName.get(key) ?? []), player]);
    }

    let scored = 0;
    const unmatched: string[] = [];

    for (const pick of picks) {
      const match = this.resolveMatch(
        byName.get(normalizeName(pick.pitcherName)) ?? [],
        pick
      );

      await this.repository.updateActualPoints(
        pick.resource,
        gameDate,
        pick.pitcherName,
        match ? match.points : null
      );

      if (match) {
        scored++;
      } else {
        unmatched.push(pick.pitcherName);
      }
    }

    return { gameDate: dateString, scored, unmatched };
  }

  /**
   * Two same-named appearances are two DIFFERENT pitchers (nobody throws
   * twice in one day) — the pick's team breaks the tie; without one the
   * pick stays unmatched rather than guessing.
   */
  private resolveMatch(
    candidates: PlayerStats[],
    pick: StreamingPick
  ): PlayerStats | null {
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1 && pick.team) {
      return candidates.find((c) => c.team === pick.team) ?? null;
    }
    return null;
  }
}
