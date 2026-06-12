import { vi } from "vitest";
import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { BattingStats } from "@/src/domain/models/BattingStats";
import { PitchingStats } from "@/src/domain/models/PitchingStats";
import { IPlayerStatsRepository } from "@/src/domain/repositories/IPlayerStatsRepository";
import { IMLBClient } from "@/src/domain/interfaces/IMLBClient";

export const GAME_DATE = new Date("2026-06-10T00:00:00Z");

export function makePlayerStats(
  name: string,
  overrides: { points?: number } = {}
): PlayerStats {
  return PlayerStats.create(
    Math.abs(name.split("").reduce((h, c) => h * 31 + c.charCodeAt(0), 7)),
    name,
    "MIL",
    "CHC",
    "CF",
    overrides.points ?? 10,
    BattingStats.create(4, 2, 1, 2, 1, 0, 1, 0),
    PitchingStats.create(0, 0, 0, 0, 0, 0, 0, 0, null, 0),
    GAME_DATE
  );
}

export function makeRepository(): IPlayerStatsRepository {
  return {
    findByDate: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    deleteByDate: vi.fn().mockResolvedValue(undefined),
    getDatesWithData: vi.fn().mockResolvedValue([]),
    createTables: vi.fn().mockResolvedValue(undefined),
  } as unknown as IPlayerStatsRepository;
}

export function makeMLBClient(): IMLBClient {
  return {
    getGamesByDate: vi.fn().mockResolvedValue([]),
    getGameBoxScore: vi.fn().mockRejectedValue(new Error("no boxscore")),
  };
}
