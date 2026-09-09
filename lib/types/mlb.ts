/**
 * A single stat line (one game, one week, or a whole season) in the shape the
 * scoring system consumes. Batting and pitching fields may both be present for
 * two-way players. Innings use MLB's "6.2" notation (6 innings + 2 outs).
 */
export interface MLBStats {
  // Batting
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  runs?: number;
  stolenBases?: number;
  walks?: number;
  hitByPitch?: number;

  // Pitching
  inningsPitched?: string;
  earnedRuns?: number;
  wins?: number;
  saves?: number;
  pitchingStrikeouts?: number;
  hitsAllowed?: number;
  walksIssued?: number;
  hitBatters?: number;
}
