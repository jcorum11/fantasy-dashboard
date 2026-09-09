/** Fantasy points a player scored in one Monday–Sunday fantasy week. */
export interface WeeklyPoints {
  /** 1-based week number within the regular season. */
  week: number;
  /** Monday, YYYY-MM-DD. */
  start: string;
  /** Sunday, YYYY-MM-DD. */
  end: string;
  points: number;
  /** Games the player appeared in that week. */
  games: number;
}

/** A player's week-by-week points for one regular season. */
export interface SeasonWeeklyPoints {
  playerId: number;
  season: number;
  weeks: WeeklyPoints[];
  totalPoints: number;
  games: number;
}
