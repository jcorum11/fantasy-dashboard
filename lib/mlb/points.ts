import { MLBStats } from "../types/mlb";

export class YahooPointsSystem {
  POINTS_SYSTEM = {
    // Batting
    runs: 1.9,
    singles: 2.6,
    doubles: 5.2,
    triples: 7.8,
    homeRuns: 10.4,
    rbis: 1.9,
    stolenBases: 4.2,
    walks: 2.6,
    hitByPitch: 2.6,

    // Pitching
    wins: 8,
    saves: 8,
    outs: 1,
    hitsAllowed: -1.3,
    earnedRuns: -3,
    walksIssued: -1.3,
    hitBatters: -1.3,
    pitchingStrikeouts: 3
  }
}

export class EspnPointsSystem {
  POINTS_SYSTEM = {
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
  }

  /**
   * Calculate fantasy points for a batting line under ESPN scoring.
   */
  calculateBattingPoints(stats: MLBStats): number {
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
      totalBases * this.POINTS_SYSTEM.totalBases +
      (stats.walks || 0) * this.POINTS_SYSTEM.walks +
      (stats.runs || 0) * this.POINTS_SYSTEM.runsScored +
      (stats.rbi || 0) * this.POINTS_SYSTEM.rbis +
      (stats.stolenBases || 0) * this.POINTS_SYSTEM.stolenBases +
      (stats.strikeouts || 0) * this.POINTS_SYSTEM.strikeouts
    );
  }

  /**
   * Calculate fantasy points for a pitching line under ESPN scoring.
   */
  calculatePitchingPoints(stats: MLBStats): number {
    let points = 0;

    if (stats.inningsPitched) {
      // Convert baseball innings format to total outs
      const [wholeInnings, partialInning] = stats.inningsPitched.split(".");
      const totalOuts =
        parseInt(wholeInnings) * 3 + (parseInt(partialInning) || 0);
      // Each out is worth 1 point
      points += totalOuts;
    }

    points += (stats.earnedRuns || 0) * this.POINTS_SYSTEM.earnedRuns;
    points += (stats.wins || 0) * this.POINTS_SYSTEM.wins;
    points += (stats.losses || 0) * this.POINTS_SYSTEM.losses;
    points += (stats.saves || 0) * this.POINTS_SYSTEM.saves;
    points += (stats.pitchingStrikeouts || 0) * this.POINTS_SYSTEM.pitchingStrikeouts;
    points += (stats.hitsAllowed || 0) * this.POINTS_SYSTEM.hitsAllowed;
    points += (stats.walksIssued || 0) * this.POINTS_SYSTEM.walksIssued;
    points += (stats.holds || 0) * this.POINTS_SYSTEM.holds;

    return points;
  }
}

/** Default scoring providers. */
export const ESPN = new EspnPointsSystem();
export const YAHOO = new YahooPointsSystem();

/**
 * Backwards-compatible standalone scorers bound to the default ESPN system,
 * which is the scoring used across the app today. Safe to destructure-import
 * (no `this`); call ESPN/YAHOO directly when you need a specific provider.
 */
export const calculateBattingPoints = (stats: MLBStats): number =>
  ESPN.calculateBattingPoints(stats);
export const calculatePitchingPoints = (stats: MLBStats): number =>
  ESPN.calculatePitchingPoints(stats);
