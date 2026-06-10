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
  /**
   * Writes a pick's realized result. NULL points with scored_at set means
   * "scored, didn't pitch"; scored_at NULL means not yet scored.
   */
  updateActualPoints(
    resource: StreamingResource,
    gameDate: Date,
    pitcherName: string,
    actualPoints: number | null
  ): Promise<void>;
  /** Distinct game dates strictly before `beforeDate` with unscored picks. */
  findUnscoredGameDates(beforeDate: Date): Promise<Date[]>;
}
