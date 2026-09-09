import { YAHOO } from "@/lib/mlb/points";
import { MLBStats } from "@/lib/types/mlb";
import {
  IMLBClient,
  SeasonStatLine,
  StatGroup,
} from "@/src/domain/interfaces/IMLBClient";
import { PlayerProfile } from "@/src/domain/models/PlayerProfile";
import { PlayerSummary } from "@/src/domain/models/PlayerSummary";
import { SeasonWeeklyPoints, WeeklyPoints } from "@/src/domain/models/WeeklyPoints";
import { seasonWeeks, weekIndexFor } from "./weeks";

function score(group: StatGroup, stats: MLBStats): number {
  return group === "hitting"
    ? YAHOO.calculateBattingPoints(stats)
    : YAHOO.calculatePitchingPoints(stats);
}

/** Round to the cent so summed floats don't leak 31.200000000000003 into JSON. */
const round = (n: number): number => Math.round(n * 100) / 100;

export class PlayerPointsService {
  constructor(
    private readonly mlb: IMLBClient,
    private readonly now: () => Date = () => new Date()
  ) {}

  /**
   * The season the main list should show: this calendar year, or last year if
   * this year's regular season has produced no stat lines yet (Jan–Mar).
   */
  async resolveCurrentSeason(): Promise<number> {
    const year = this.now().getUTCFullYear();
    const lines = await this.mlb.getSeasonStatLines(year, "hitting");
    return lines.length > 0 ? year : year - 1;
  }

  /**
   * Every player with a regular-season appearance in `season`, with total
   * Yahoo points, sorted best first. Yahoo scoring is linear in counting stats,
   * so season aggregates score exactly the same as summing per-game lines.
   */
  async listPlayers(season: number): Promise<PlayerSummary[]> {
    const [hitting, pitching] = await Promise.all([
      this.mlb.getSeasonStatLines(season, "hitting"),
      this.mlb.getSeasonStatLines(season, "pitching"),
    ]);

    const byId = new Map<number, PlayerSummary>();
    const add = (group: StatGroup, line: SeasonStatLine) => {
      const points = score(group, line.stats);
      const existing = byId.get(line.playerId);
      if (!existing) {
        byId.set(line.playerId, {
          id: line.playerId,
          name: line.name,
          team: line.team,
          position: line.position,
          points,
          games: line.games,
        });
        return;
      }
      existing.points += points;
      existing.games = Math.max(existing.games, line.games);
    };
    // Hitting first so a two-way player keeps their hitting position label.
    hitting.forEach((l) => add("hitting", l));
    pitching.forEach((l) => add("pitching", l));

    return [...byId.values()]
      .map((p) => ({ ...p, points: round(p.points) }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  }

  async getPlayer(playerId: number): Promise<PlayerProfile | null> {
    return this.mlb.getPlayer(playerId);
  }

  async getSeasonsPlayed(playerId: number): Promise<number[]> {
    return this.mlb.getSeasonsPlayed(playerId);
  }

  /** Week-by-week points for one regular season, including zero-point weeks. */
  async getSeasonWeeklyPoints(
    playerId: number,
    season: number
  ): Promise<SeasonWeeklyPoints> {
    const [dates, log] = await Promise.all([
      this.mlb.getRegularSeasonDates(season),
      this.mlb.getGameLog(playerId, season),
    ]);

    const weeks: WeeklyPoints[] = seasonWeeks(dates.start, dates.end).map(
      (w) => ({ ...w, points: 0, games: 0 })
    );
    // Distinct games per week: doubleheaders count twice, a two-way player's
    // hitting and pitching lines for the same game count once.
    const gamesByWeek = weeks.map(() => new Set<number>());

    for (const entry of log) {
      const index = weekIndexFor(entry.date, weeks);
      if (index === -1) continue; // outside the regular-season weeks
      weeks[index].points += score(entry.group, entry.stats);
      gamesByWeek[index].add(entry.gamePk);
    }

    weeks.forEach((w, i) => {
      w.points = round(w.points);
      w.games = gamesByWeek[i].size;
    });

    return {
      playerId,
      season,
      weeks,
      totalPoints: round(weeks.reduce((sum, w) => sum + w.points, 0)),
      games: weeks.reduce((sum, w) => sum + w.games, 0),
    };
  }
}
