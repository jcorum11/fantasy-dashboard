import { StreamingPick } from "../models/StreamingPick";
import { StreamingResource } from "../models/StreamingResource";

export interface IStreamingPickRepository {
  createTables(): Promise<void>;
  /**
   * Upserts picks on (resource, game_date, pitcher_name) — re-ingesting the
   * same day refreshes rank/tier/score instead of duplicating rows.
   */
  saveBatch(picks: StreamingPick[]): Promise<void>;
  findByGameDateRange(
    startDate: Date,
    endDate: Date,
    resource?: StreamingResource
  ): Promise<StreamingPick[]>;
}
