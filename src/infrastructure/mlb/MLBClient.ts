import {
  GameLogEntry,
  IMLBClient,
  RegularSeasonDates,
  SeasonStatLine,
  StatGroup,
} from "@/src/domain/interfaces/IMLBClient";
import { PlayerProfile } from "@/src/domain/models/PlayerProfile";
import { mapStat, RawStat } from "./statMappers";

const HOUR = 60 * 60;
const WEEK = 7 * 24 * HOUR;

interface RawSplit {
  season?: string;
  date?: string;
  player?: { id: number; fullName: string };
  team?: { name: string } | null;
  position?: { abbreviation: string };
  game?: { gamePk: number };
  stat: RawStat;
}

interface RawStatsResponse {
  stats?: Array<{ group?: { displayName: string }; splits?: RawSplit[] }>;
}

interface RawPeopleResponse {
  people?: Array<{
    id: number;
    fullName: string;
    active?: boolean;
    primaryPosition?: { abbreviation: string };
    currentTeam?: { name: string };
  }>;
}

interface RawSeasonsResponse {
  seasons?: Array<{
    seasonId: string;
    regularSeasonStartDate: string;
    regularSeasonEndDate: string;
  }>;
}

/**
 * MLB Stats API gateway. Requests go through Next's fetch cache: seasons that
 * are over are cached for a week, the in-progress season for an hour.
 */
export class MLBClient implements IMLBClient {
  private readonly baseUrl = "https://statsapi.mlb.com/api/v1";

  constructor(private readonly now: () => Date = () => new Date()) {}

  async getPlayer(playerId: number): Promise<PlayerProfile | null> {
    const response = await fetch(
      `${this.baseUrl}/people/${playerId}?hydrate=currentTeam`,
      { next: { revalidate: 24 * HOUR } }
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`MLB API ${response.status} ${response.statusText} for /people/${playerId}`);
    }
    const data = (await response.json()) as RawPeopleResponse;
    const p = data.people?.[0];
    if (!p) return null;
    return {
      id: p.id,
      name: p.fullName,
      position: p.primaryPosition?.abbreviation ?? "—",
      team: p.currentTeam?.name ?? null,
      active: p.active ?? false,
    };
  }

  async getSeasonStatLines(
    season: number,
    group: StatGroup
  ): Promise<SeasonStatLine[]> {
    const params = new URLSearchParams({
      stats: "season",
      group,
      season: String(season),
      sportId: "1",
      gameType: "R",
      playerPool: "all",
      limit: "5000",
    });
    const data = await this.get<RawStatsResponse>(`/stats?${params}`, season);
    const splits = data.stats?.[0]?.splits ?? [];

    return splits
      .filter((s) => s.player)
      .map((s) => ({
        playerId: s.player!.id,
        name: s.player!.fullName,
        team: s.team?.name ?? "—",
        position: s.position?.abbreviation ?? "—",
        games: s.stat.gamesPlayed ?? 0,
        stats: mapStat(group, s.stat),
      }));
  }

  async getGameLog(playerId: number, season: number): Promise<GameLogEntry[]> {
    const params = new URLSearchParams({
      stats: "gameLog",
      season: String(season),
      group: "hitting,pitching",
      gameType: "R",
    });
    const data = await this.get<RawStatsResponse>(
      `/people/${playerId}/stats?${params}`,
      season
    );

    const entries: GameLogEntry[] = [];
    for (const block of data.stats ?? []) {
      const group = block.group?.displayName as StatGroup | undefined;
      if (group !== "hitting" && group !== "pitching") continue;
      for (const split of block.splits ?? []) {
        if (!split.date || !split.game) continue;
        entries.push({
          date: split.date,
          gamePk: split.game.gamePk,
          group,
          stats: mapStat(group, split.stat),
        });
      }
    }
    return entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getSeasonsPlayed(playerId: number): Promise<number[]> {
    const params = new URLSearchParams({
      stats: "yearByYear",
      group: "hitting,pitching",
      gameType: "R",
    });
    // Career history only grows once a year; cache like a finished season.
    const data = await this.get<RawStatsResponse>(
      `/people/${playerId}/stats?${params}`,
      this.currentSeason() - 1
    );

    const seasons = new Set<number>();
    for (const block of data.stats ?? []) {
      for (const split of block.splits ?? []) {
        if (split.season) seasons.add(Number(split.season));
      }
    }
    return [...seasons].sort((a, b) => a - b);
  }

  async getRegularSeasonDates(season: number): Promise<RegularSeasonDates> {
    const data = await this.get<RawSeasonsResponse>(
      `/seasons/${season}?sportId=1`,
      season
    );
    const s = data.seasons?.[0];
    if (!s?.regularSeasonStartDate || !s?.regularSeasonEndDate) {
      throw new Error(`No regular-season dates for ${season}`);
    }
    return { start: s.regularSeasonStartDate, end: s.regularSeasonEndDate };
  }

  private currentSeason(): number {
    return this.now().getUTCFullYear();
  }

  private async get<T>(path: string, season: number): Promise<T> {
    const revalidate = season < this.currentSeason() ? WEEK : HOUR;
    const response = await fetch(`${this.baseUrl}${path}`, {
      next: { revalidate },
    });
    if (!response.ok) {
      throw new Error(
        `MLB API ${response.status} ${response.statusText} for ${path}`
      );
    }
    return (await response.json()) as T;
  }
}
