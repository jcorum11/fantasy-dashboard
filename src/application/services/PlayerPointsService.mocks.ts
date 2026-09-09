import {
  GameLogEntry,
  IMLBClient,
  RegularSeasonDates,
  SeasonStatLine,
  StatGroup,
} from "@/src/domain/interfaces/IMLBClient";
import { PlayerProfile } from "@/src/domain/models/PlayerProfile";

/** In-memory IMLBClient seeded with whatever a test needs. */
export class FakeMLBClient implements IMLBClient {
  seasonLines: Record<string, SeasonStatLine[]> = {};
  gameLogs: Record<string, GameLogEntry[]> = {};
  seasonsPlayed: Record<number, number[]> = {};
  seasonDates: Record<number, RegularSeasonDates> = {};
  players: Record<number, PlayerProfile> = {};

  async getPlayer(playerId: number) {
    return this.players[playerId] ?? null;
  }
  async getSeasonStatLines(season: number, group: StatGroup) {
    return this.seasonLines[`${season}:${group}`] ?? [];
  }
  async getGameLog(playerId: number, season: number) {
    return this.gameLogs[`${playerId}:${season}`] ?? [];
  }
  async getSeasonsPlayed(playerId: number) {
    return this.seasonsPlayed[playerId] ?? [];
  }
  async getRegularSeasonDates(season: number) {
    const dates = this.seasonDates[season];
    if (!dates) throw new Error(`No regular-season dates for ${season}`);
    return dates;
  }
}

export const hitterLine = (
  overrides: Partial<SeasonStatLine> = {}
): SeasonStatLine => ({
  playerId: 1,
  name: "Slugger One",
  team: "Team A",
  position: "1B",
  games: 50,
  stats: { homeRuns: 10, hits: 10 }, // 10 HR = 104, 0 singles
  ...overrides,
});

export const pitcherLine = (
  overrides: Partial<SeasonStatLine> = {}
): SeasonStatLine => ({
  playerId: 2,
  name: "Ace Two",
  team: "Team B",
  position: "P",
  games: 10,
  stats: { inningsPitched: "10.0", pitchingStrikeouts: 10 }, // 30 outs + 30 = 60
  ...overrides,
});
