import { IngestRun } from "../models/IngestRun";
import { StreamingPick } from "../models/StreamingPick";
import { StreamingResource } from "../models/StreamingResource";

export interface IStreamingPickRepository {
  /** Records the outcome of one resource's ingest attempt (success or failure). */
  recordIngestRun(run: IngestRun): Promise<void>;
  findIngestRuns(startDate: Date, endDate: Date): Promise<IngestRun[]>;
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
