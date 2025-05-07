import { PlayerStats } from "../models/PlayerStats";

export interface IPlayerStatsRepository {
  findByDate(date: Date): Promise<PlayerStats[]>;
  save(stats: PlayerStats): Promise<void>;
  saveBatch(stats: PlayerStats[]): Promise<void>;
  createTables(): Promise<void>;
}
