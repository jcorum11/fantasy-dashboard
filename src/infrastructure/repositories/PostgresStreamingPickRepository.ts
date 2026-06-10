import { neon, neonConfig } from "@neondatabase/serverless";
import format from "pg-format";
import { IStreamingPickRepository } from "../../domain/repositories/IStreamingPickRepository";
import { IngestRun } from "../../domain/models/IngestRun";
import { StreamingPick } from "../../domain/models/StreamingPick";
import { StreamingResource } from "../../domain/models/StreamingResource";
import {
  parseDateColumn,
  rowToStreamingPick,
  StreamingPickRow,
} from "./streamingPickMapper";

export class PostgresStreamingPickRepository
  implements IStreamingPickRepository
{
  private sql: any;

  constructor(databaseUrl: string) {
    neonConfig.fetchConnectionCache = true;
    this.sql = neon(databaseUrl);
  }

  async createTables(): Promise<void> {
    try {
      await this.sql`
        CREATE TABLE IF NOT EXISTS streaming_picks (
          id SERIAL PRIMARY KEY,
          resource VARCHAR(50) NOT NULL,
          pitcher_name VARCHAR(255) NOT NULL,
          game_date DATE NOT NULL,
          pick_date DATE NOT NULL,
          mlb_player_id INTEGER,
          team VARCHAR(50),
          opponent VARCHAR(50),
          is_home BOOLEAN,
          rank INTEGER,
          tier VARCHAR(100),
          raw_score NUMERIC,
          appearance INTEGER NOT NULL DEFAULT 1,
          actual_points FLOAT,
          scored_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (resource, game_date, pitcher_name, appearance)
        );
      `;
      // Idempotent migrations for tables created before these columns
      // existed (the schema evolved across commits on this feature).
      await this.sql`
        ALTER TABLE streaming_picks
        ADD COLUMN IF NOT EXISTS appearance INTEGER NOT NULL DEFAULT 1
      `;
      await this.sql`
        ALTER TABLE streaming_picks ADD COLUMN IF NOT EXISTS actual_points FLOAT
      `;
      await this.sql`
        ALTER TABLE streaming_picks
        ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP WITH TIME ZONE
      `;
      await this.sql`
        ALTER TABLE streaming_picks
        DROP CONSTRAINT IF EXISTS streaming_picks_resource_game_date_pitcher_name_key
      `;
      await this.sql`
        ALTER TABLE streaming_picks
        DROP CONSTRAINT IF EXISTS streaming_picks_resource_game_date_pitcher_name_appearance_key
      `;
      await this.sql`
        ALTER TABLE streaming_picks
        ADD CONSTRAINT streaming_picks_resource_game_date_pitcher_name_appearance_key
        UNIQUE (resource, game_date, pitcher_name, appearance)
      `;
      await this.sql`
        CREATE TABLE IF NOT EXISTS ingest_runs (
          id SERIAL PRIMARY KEY,
          resource VARCHAR(50) NOT NULL,
          run_date DATE NOT NULL,
          status VARCHAR(20) NOT NULL,
          picks_count INTEGER NOT NULL DEFAULT 0,
          error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } catch (error: any) {
      throw new Error(
        `Failed to create streaming_picks table: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  async updateActualPoints(
    resource: StreamingResource,
    gameDate: Date,
    pitcherName: string,
    actualPoints: number | null
  ): Promise<void> {
    try {
      // NULL points with scored_at set = "scored, didn't pitch" — distinct
      // from scored_at NULL (not yet scored).
      await this.sql`
        UPDATE streaming_picks
        SET actual_points = ${actualPoints}, scored_at = CURRENT_TIMESTAMP
        WHERE resource = ${resource}
          AND game_date = ${gameDate.toISOString().split("T")[0]}::date
          AND pitcher_name = ${pitcherName}
      `;
    } catch (error: any) {
      throw new Error(
        `Failed to update actual points: ${error?.message || "Unknown error"}`
      );
    }
  }

  async findUnscoredGameDates(beforeDate: Date): Promise<Date[]> {
    try {
      const rows = await this.sql`
        SELECT DISTINCT game_date
        FROM streaming_picks
        WHERE scored_at IS NULL
          AND game_date < ${beforeDate.toISOString().split("T")[0]}::date
        ORDER BY game_date
      `;
      return rows.map((row: any) => parseDateColumn(row.game_date));
    } catch (error: any) {
      throw new Error(
        `Failed to find unscored game dates: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  async recordIngestRun(run: IngestRun): Promise<void> {
    try {
      await this.sql`
        INSERT INTO ingest_runs (resource, run_date, status, picks_count, error)
        VALUES (
          ${run.resource},
          ${run.runDate.toISOString().split("T")[0]},
          ${run.status},
          ${run.picksCount},
          ${run.error}
        )
      `;
    } catch (error: any) {
      throw new Error(
        `Failed to record ingest run: ${error?.message || "Unknown error"}`
      );
    }
  }

  async findIngestRuns(startDate: Date, endDate: Date): Promise<IngestRun[]> {
    try {
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const rows = await this.sql`
        SELECT resource, run_date, status, picks_count, error
        FROM ingest_runs
        WHERE run_date BETWEEN ${start}::date AND ${end}::date
        ORDER BY run_date, resource, id
      `;

      return rows.map((row: any) => ({
        resource: row.resource,
        runDate: parseDateColumn(row.run_date),
        status: row.status,
        picksCount: row.picks_count,
        error: row.error,
      }));
    } catch (error: any) {
      throw new Error(
        `Failed to find ingest runs: ${error?.message || "Unknown error"}`
      );
    }
  }

  async saveBatch(picks: StreamingPick[]): Promise<void> {
    if (picks.length === 0) return;

    try {
      const valueTuples = picks.map((pick) => [
        pick.resource,
        pick.pitcherName,
        pick.gameDate.toISOString().split("T")[0],
        pick.pickDate.toISOString().split("T")[0],
        pick.mlbPlayerId,
        pick.team,
        pick.opponent,
        pick.isHome,
        pick.rank,
        pick.tier,
        pick.rawScore,
        pick.appearance,
      ]);

      const query = format(
        `INSERT INTO streaming_picks (
          resource, pitcher_name, game_date, pick_date,
          mlb_player_id, team, opponent, is_home,
          rank, tier, raw_score, appearance
        ) VALUES %L
        ON CONFLICT (resource, game_date, pitcher_name, appearance) DO UPDATE SET
          pick_date = EXCLUDED.pick_date,
          mlb_player_id = EXCLUDED.mlb_player_id,
          team = EXCLUDED.team,
          opponent = EXCLUDED.opponent,
          is_home = EXCLUDED.is_home,
          rank = EXCLUDED.rank,
          tier = EXCLUDED.tier,
          raw_score = EXCLUDED.raw_score`,
        valueTuples
      );

      await this.sql.query(query);
    } catch (error: any) {
      throw new Error(
        `Failed to save streaming picks batch: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  async findByGameDateRange(
    startDate: Date,
    endDate: Date,
    resource?: StreamingResource
  ): Promise<StreamingPick[]> {
    try {
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const rows: StreamingPickRow[] = resource
        ? await this.sql`
            SELECT resource, pitcher_name, game_date, pick_date,
                   mlb_player_id, team, opponent, is_home,
                   rank, tier, raw_score, appearance, actual_points, scored_at
            FROM streaming_picks
            WHERE game_date BETWEEN ${start}::date AND ${end}::date
              AND resource = ${resource}
            ORDER BY game_date, resource, rank NULLS LAST
          `
        : await this.sql`
            SELECT resource, pitcher_name, game_date, pick_date,
                   mlb_player_id, team, opponent, is_home,
                   rank, tier, raw_score, appearance, actual_points, scored_at
            FROM streaming_picks
            WHERE game_date BETWEEN ${start}::date AND ${end}::date
            ORDER BY game_date, resource, rank NULLS LAST
          `;

      return rows.map(rowToStreamingPick);
    } catch (error: any) {
      throw new Error(
        `Failed to find streaming picks by date range: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }
}
