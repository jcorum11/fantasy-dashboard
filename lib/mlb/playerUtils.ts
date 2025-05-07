import { BattingStats } from "../../src/domain/models/BattingStats";
import { PitchingStats } from "../../src/domain/models/PitchingStats";

export function determinePlayerPosition(
  player: any,
  pitchingStats: PitchingStats
): string {
  if (!player.stats?.pitching?.gamesPlayed) {
    return player.position.abbreviation;
  }

  if (player.stats.pitching.gamesStarted > 0) {
    return "SP";
  }

  if (pitchingStats.saves > 0 || pitchingStats.holds !== null) {
    return "RP";
  }

  return pitchingStats.inningsPitched >= 4 ? "SP" : "RP";
}

export function hasRelevantStats(
  battingStats: BattingStats,
  pitchingStats: PitchingStats
): boolean {
  return (
    battingStats.atBats > 0 ||
    battingStats.walks > 0 ||
    battingStats.strikeouts > 0 ||
    pitchingStats.inningsPitched > 0 ||
    pitchingStats.pitchingStrikeouts > 0
  );
}
