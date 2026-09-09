/** Who a player is, for the header of their page. */
export interface PlayerProfile {
  id: number;
  name: string;
  /** Primary position abbreviation, e.g. "SS", "P", "TWP" (two-way). */
  position: string;
  /** Current team name, or null if unsigned/retired. */
  team: string | null;
  active: boolean;
}
