/** One row of the main player list: who they are and what they've scored this season. */
export interface PlayerSummary {
  id: number;
  name: string;
  team: string;
  /** Position abbreviation from the MLB API, e.g. "SS", "P", "DH". */
  position: string;
  /** Total Yahoo fantasy points across the regular season so far. */
  points: number;
  /** Regular-season games played (hitting or pitching appearances). */
  games: number;
}
