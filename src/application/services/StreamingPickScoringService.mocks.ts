// Test fixtures/mocks for StreamingPickScoringService.

import { vi } from "vitest";
import { BattingStats } from "@/src/domain/models/BattingStats";
import { PitchingStats } from "@/src/domain/models/PitchingStats";
import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { StreamingResource } from "@/src/domain/models/StreamingResource";

export const GAME_DATE = new Date("2026-06-10T00:00:00Z");

export function makePick(
  pitcherName: string,
  overrides: { resource?: StreamingResource; team?: string | null } = {}
): StreamingPick {
  return StreamingPick.create({
    resource: overrides.resource ?? "dailywaivers",
    pitcherName,
    gameDate: GAME_DATE,
    pickDate: GAME_DATE,
    team: overrides.team ?? null,
    rank: 1,
  });
}

export function makePlayerStats(
  name: string,
  options: {
    team?: string;
    position?: string;
    points?: number;
    inningsPitched?: number;
  } = {}
): PlayerStats {
  const inningsPitched = options.inningsPitched ?? 6;
  return PlayerStats.create(
    1,
    name,
    options.team ?? "PIT",
    "MIA",
    options.position ?? "SP",
    options.points ?? 20,
    BattingStats.create(0, 0, 0, 0, 0, 0, 0, 0),
    PitchingStats.create(inningsPitched, 2, 7, 4, 1, 1, 0, 0, 0, 1),
    GAME_DATE
  );
}

export function makeRepository(picks: StreamingPick[]) {
  return {
    createTables: vi.fn().mockResolvedValue(undefined),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    findByGameDateRange: vi.fn().mockResolvedValue(picks),
    recordIngestRun: vi.fn().mockResolvedValue(undefined),
    findIngestRuns: vi.fn().mockResolvedValue([]),
    updateActualPoints: vi.fn().mockResolvedValue(undefined),
  };
}

export function makeStatsProvider(stats: PlayerStats[]) {
  return {
    getPlayerStatsByDate: vi.fn().mockResolvedValue(stats),
  };
}
