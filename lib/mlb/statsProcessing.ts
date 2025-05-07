import { MLBStats } from "../types/mlb";
import { calculateBattingPoints, calculatePitchingPoints } from "./points";
import { BattingStats } from "../../src/domain/models/BattingStats";
import { PitchingStats } from "../../src/domain/models/PitchingStats";

export interface ProcessedStats {
  points: number;
  battingStats: BattingStats;
  pitchingStats: PitchingStats;
}

export interface RawBattingStats {
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  runs: number;
  stolenBases: number;
  strikeouts: number;
  walks: number;
}

export interface RawPitchingStats {
  inningsPitched: string | number;
  earnedRuns: number;
  strikeouts: number;
  hitsAllowed: number;
  walksIssued: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number | null;
  gamesStarted: number;
}

export function extractBattingStats(player: any): RawBattingStats {
  return {
    atBats: player.stats?.batting?.atBats ?? 0,
    hits: player.stats?.batting?.hits ?? 0,
    doubles: player.stats?.batting?.doubles ?? 0,
    triples: player.stats?.batting?.triples ?? 0,
    homeRuns: player.stats?.batting?.homeRuns ?? 0,
    rbi: player.stats?.batting?.rbi ?? 0,
    runs: player.stats?.batting?.runs ?? 0,
    stolenBases: player.stats?.batting?.stolenBases ?? 0,
    strikeouts: player.stats?.batting?.strikeOuts ?? 0,
    walks: player.stats?.batting?.baseOnBalls ?? 0,
  };
}

export function extractPitchingStats(player: any): RawPitchingStats {
  return {
    inningsPitched: player.stats?.pitching?.inningsPitched ?? 0,
    earnedRuns: player.stats?.pitching?.earnedRuns ?? 0,
    strikeouts: player.stats?.pitching?.strikeOuts ?? 0,
    hitsAllowed: player.stats?.pitching?.hits ?? 0,
    walksIssued: player.stats?.pitching?.baseOnBalls ?? 0,
    wins: player.stats?.pitching?.wins ?? 0,
    losses: player.stats?.pitching?.losses ?? 0,
    saves: player.stats?.pitching?.saves ?? 0,
    holds: player.stats?.pitching?.holds ?? null,
    gamesStarted: player.stats?.pitching?.gamesStarted ?? 0,
  };
}

export function calculateBattingPointsFromRaw(stats: RawBattingStats): number {
  const mlbStats: MLBStats = {
    ...stats,
    pitchingStrikeouts: 0,
    hitsAllowed: 0,
    walksIssued: 0,
    wins: 0,
    losses: 0,
    saves: 0,
    holds: undefined,
    gamesStarted: 0,
  };
  return calculateBattingPoints(mlbStats);
}

export function calculatePitchingPointsFromRaw(
  stats: RawPitchingStats
): number {
  const mlbStats: MLBStats = {
    atBats: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    rbi: 0,
    runs: 0,
    stolenBases: 0,
    strikeouts: 0,
    walks: 0,
    inningsPitched: stats.inningsPitched.toString(),
    earnedRuns: stats.earnedRuns,
    pitchingStrikeouts: stats.strikeouts,
    hitsAllowed: stats.hitsAllowed,
    walksIssued: stats.walksIssued,
    wins: stats.wins,
    losses: stats.losses,
    saves: stats.saves,
    holds: stats.holds === null ? undefined : stats.holds,
    gamesStarted: stats.gamesStarted,
  };
  return calculatePitchingPoints(mlbStats);
}

export function createBattingStats(stats: RawBattingStats): BattingStats {
  return BattingStats.create(
    Number(stats.atBats),
    Number(stats.hits),
    Number(stats.homeRuns),
    Number(stats.rbi),
    Number(stats.runs),
    Number(stats.stolenBases),
    Number(stats.strikeouts),
    Number(stats.walks)
  );
}

export function createPitchingStats(stats: RawPitchingStats): PitchingStats {
  return PitchingStats.create(
    stats.inningsPitched ? parseFloat(stats.inningsPitched.toString()) : 0,
    Number(stats.earnedRuns),
    Number(stats.strikeouts),
    Number(stats.hitsAllowed),
    Number(stats.walksIssued),
    Number(stats.wins),
    Number(stats.losses),
    Number(stats.saves),
    stats.holds,
    Number(stats.gamesStarted)
  );
}
