import { MLBStats } from "../types/mlb";

// Fantasy points scoring system
export const POINTS_SYSTEM = {
  // Batting
  totalBases: 1,
  walks: 1,
  runsScored: 1,
  rbis: 1,
  stolenBases: 1,
  strikeouts: -1,

  // Pitching
  inningsPitched: 3,
  earnedRuns: -2,
  wins: 2,
  losses: -2,
  saves: 5,
  pitchingStrikeouts: 1,
  hitsAllowed: -1,
  walksIssued: -1,
  holds: 2,
};

/**
 * Calculate fantasy points for batting stats
 */
export function calculateBattingPoints(stats: MLBStats): number {
  // Calculate total bases (singles = 1, doubles = 2, triples = 3, home runs = 4)
  const singles = Math.max(
    0,
    (stats.hits || 0) -
      ((stats.doubles || 0) + (stats.triples || 0) + (stats.homeRuns || 0))
  );
  const totalBases =
    singles +
    (stats.doubles || 0) * 2 +
    (stats.triples || 0) * 3 +
    (stats.homeRuns || 0) * 4;

  return (
    totalBases * POINTS_SYSTEM.totalBases +
    (stats.walks || 0) * POINTS_SYSTEM.walks +
    (stats.runs || 0) * POINTS_SYSTEM.runsScored +
    (stats.rbi || 0) * POINTS_SYSTEM.rbis +
    (stats.stolenBases || 0) * POINTS_SYSTEM.stolenBases +
    (stats.strikeouts || 0) * POINTS_SYSTEM.strikeouts
  );
}

/**
 * Calculate fantasy points for pitching stats
 */
export function calculatePitchingPoints(stats: MLBStats): number {
  let points = 0;

  if (stats.inningsPitched) {
    // Convert baseball innings format to total outs
    const [wholeInnings, partialInning] = stats.inningsPitched.split(".");
    const totalOuts =
      parseInt(wholeInnings) * 3 + (parseInt(partialInning) || 0);
    // Each out is worth 1 point
    points += totalOuts;
  }

  points += (stats.earnedRuns || 0) * POINTS_SYSTEM.earnedRuns;
  points += (stats.wins || 0) * POINTS_SYSTEM.wins;
  points += (stats.losses || 0) * POINTS_SYSTEM.losses;
  points += (stats.saves || 0) * POINTS_SYSTEM.saves;
  points += (stats.pitchingStrikeouts || 0) * POINTS_SYSTEM.pitchingStrikeouts;
  points += (stats.hitsAllowed || 0) * POINTS_SYSTEM.hitsAllowed;
  points += (stats.walksIssued || 0) * POINTS_SYSTEM.walksIssued;
  points += (stats.holds || 0) * POINTS_SYSTEM.holds;

  return points;
}
