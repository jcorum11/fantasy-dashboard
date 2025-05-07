import { Container } from "../src/infrastructure/config/container";
import { PlayerStats } from "../src/domain/models/PlayerStats";
import { BattingStats } from "../src/domain/models/BattingStats";
import { PitchingStats } from "../src/domain/models/PitchingStats";

// Initialize container
const container = Container.getInstance();
container.initialize(process.env.DATABASE_URL!);

// Export types
export type { PlayerStats };
export type { BattingStats };
export type { PitchingStats };

// Export functions
export async function createTables() {
  const service = container.getPlayerStatsService();
  await service.initializeDatabase();
}

export async function insertPlayerStats(stats: PlayerStats) {
  const service = container.getPlayerStatsService();
  await service.savePlayerStats(stats);
}

export async function insertPlayerStatsBatch(statsArray: PlayerStats[]) {
  const service = container.getPlayerStatsService();
  await service.savePlayerStatsBatch(statsArray);
}

export async function getPlayerStatsByDate(date: string) {
  const service = container.getPlayerStatsService();
  return service.getPlayerStatsByDate(new Date(date));
}
