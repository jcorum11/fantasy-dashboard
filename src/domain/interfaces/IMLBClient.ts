import { MLBStats } from "@/lib/types/mlb";
import { PlayerProfile } from "@/src/domain/models/PlayerProfile";

export type StatGroup = "hitting" | "pitching";

/** A player's aggregate regular-season stat line for one stat group. */
export interface SeasonStatLine {
  playerId: number;
  name: string;
  team: string;
  position: string;
  games: number;
  stats: MLBStats;
}

/** One game's stat line for one stat group. */
export interface GameLogEntry {
  /** Game date, YYYY-MM-DD. */
  date: string;
  /** MLB game id; distinguishes doubleheaders and ties two-way lines together. */
  gamePk: number;
  group: StatGroup;
  stats: MLBStats;
}

export interface RegularSeasonDates {
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD */
  end: string;
}

/** Read-only gateway to the MLB Stats API. Regular-season data only. */
export interface IMLBClient {
  /** Basic profile for a player, or null if the id is unknown. */
  getPlayer(playerId: number): Promise<PlayerProfile | null>;

  /** Every player with a regular-season stat line in `group` for `season`. */
  getSeasonStatLines(season: number, group: StatGroup): Promise<SeasonStatLine[]>;

  /** A player's regular-season game log (hitting and pitching) for `season`. */
  getGameLog(playerId: number, season: number): Promise<GameLogEntry[]>;

  /** Distinct seasons in which the player has a regular-season stat line, ascending. */
  getSeasonsPlayed(playerId: number): Promise<number[]>;

  /** Regular-season start and end dates for `season`. */
  getRegularSeasonDates(season: number): Promise<RegularSeasonDates>;
}
