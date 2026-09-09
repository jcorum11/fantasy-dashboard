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

  /**
   * Validate a counting stat that Yahoo actually scores: must be a non-negative
   * whole number. Unscored stats are never passed through here, so their value
   * is ignored. Returns 0 when the stat is absent.
   */
  private requireCount(name: string, value: number | undefined): number {
    if (value === undefined) return 0
    if (value < 0) throw new Error(`${name} cannot be negative`)
    if (!Number.isInteger(value)) throw new Error(`${name} must be a whole number`)
    return value
  }

  /**
   * Calculate fantasy points for a batting line under Yahoo scoring. Singles are
   * derived from hits minus extra-base hits (the MLB API never provides them).
   */
  calculateBattingPoints(stats: MLBStats): number {
    const hits = this.requireCount("hits", stats.hits)
    const doubles = this.requireCount("doubles", stats.doubles)
    const triples = this.requireCount("triples", stats.triples)
    const homeRuns = this.requireCount("homeRuns", stats.homeRuns)
    const runs = this.requireCount("runs", stats.runs)
    const rbi = this.requireCount("rbi", stats.rbi)
    const stolenBases = this.requireCount("stolenBases", stats.stolenBases)
    const walks = this.requireCount("walks", stats.walks)
    const hitByPitch = this.requireCount("hitByPitch", stats.hitByPitch)

    const singles = Math.max(0, hits - (doubles + triples + homeRuns))

    return (
      singles * this.POINTS_SYSTEM.singles +
      doubles * this.POINTS_SYSTEM.doubles +
      triples * this.POINTS_SYSTEM.triples +
      homeRuns * this.POINTS_SYSTEM.homeRuns +
      runs * this.POINTS_SYSTEM.runs +
      rbi * this.POINTS_SYSTEM.rbis +
      stolenBases * this.POINTS_SYSTEM.stolenBases +
      walks * this.POINTS_SYSTEM.walks +
      hitByPitch * this.POINTS_SYSTEM.hitByPitch
    )
  }

  /**
   * Calculate fantasy points for a pitching line under Yahoo scoring. Innings are
   * scored as outs (1 point each); losses and holds are not scored.
   */
  calculatePitchingPoints(stats: MLBStats): number {
    let points = 0

    if (stats.inningsPitched !== undefined) {
      if (parseFloat(stats.inningsPitched) < 0) {
        throw new Error("inningsPitched cannot be negative")
      }
      // Baseball innings format: "6.2" => 6 full innings + 2 outs = 20 outs
      const [wholeInnings, partialInning] = stats.inningsPitched.split(".")
      const totalOuts = parseInt(wholeInnings) * 3 + (parseInt(partialInning) || 0)
      points += totalOuts * this.POINTS_SYSTEM.outs
    }

    points += this.requireCount("wins", stats.wins) * this.POINTS_SYSTEM.wins
    points += this.requireCount("saves", stats.saves) * this.POINTS_SYSTEM.saves
    points += this.requireCount("pitchingStrikeouts", stats.pitchingStrikeouts) * this.POINTS_SYSTEM.pitchingStrikeouts
    points += this.requireCount("hitsAllowed", stats.hitsAllowed) * this.POINTS_SYSTEM.hitsAllowed
    points += this.requireCount("earnedRuns", stats.earnedRuns) * this.POINTS_SYSTEM.earnedRuns
    points += this.requireCount("walksIssued", stats.walksIssued) * this.POINTS_SYSTEM.walksIssued
    points += this.requireCount("hitBatters", stats.hitBatters) * this.POINTS_SYSTEM.hitBatters

    return points
  }
}

/** The single scoring system this app uses. */
export const YAHOO = new YahooPointsSystem();
