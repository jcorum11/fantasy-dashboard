import { neon, neonConfig } from "@neondatabase/serverless";
import format from "pg-format";
import { IPlayerStatsRepository } from "../../domain/repositories/IPlayerStatsRepository";
import { PlayerStats } from "../../domain/models/PlayerStats";
import { BattingStats } from "../../domain/models/BattingStats";
import { PitchingStats } from "../../domain/models/PitchingStats";

export class PostgresPlayerStatsRepository implements IPlayerStatsRepository {
  private sql: any;

  constructor(databaseUrl: string) {
    neonConfig.fetchConnectionCache = true;
    this.sql = neon(databaseUrl);
  }

  async createTables(): Promise<void> {
    try {
      await this.sql`
        CREATE TABLE IF NOT EXISTS player_stats (
          id SERIAL PRIMARY KEY,
          player_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          team VARCHAR(50) NOT NULL,
          position VARCHAR(50) NOT NULL,
          
          -- Batting stats
          at_bats INTEGER,
          hits INTEGER,
          home_runs INTEGER,
          rbis INTEGER,
          runs INTEGER,
          stolen_bases INTEGER,
          strikeouts INTEGER,
          walks INTEGER,
          
          -- Pitching stats
          innings_pitched FLOAT,
          earned_runs INTEGER,
          wins INTEGER,
          losses INTEGER,
          saves INTEGER,
          pitching_strikeouts INTEGER,
          hits_allowed INTEGER,
          walks_issued INTEGER,
          holds INTEGER,
          
          points FLOAT,
          game_date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } catch (error: any) {
      throw new Error(
        `Failed to create tables: ${error?.message || "Unknown error"}`
      );
    }
  }

  async findByDate(date: Date): Promise<PlayerStats[]> {
    try {
      const result = await this.sql`
        SELECT 
          player_id as id,
          name,
          team,
          position,
          json_build_object(
            'atBats', at_bats,
            'hits', hits,
            'homeRuns', home_runs,
            'rbi', rbis,
            'runs', runs,
            'stolenBases', stolen_bases,
            'strikeouts', strikeouts,
            'walks', walks
          ) as "battingStats",
          json_build_object(
            'inningsPitched', innings_pitched,
            'earnedRuns', earned_runs,
            'pitchingStrikeouts', pitching_strikeouts,
            'hitsAllowed', hits_allowed,
            'walksIssued', walks_issued,
            'wins', wins,
            'losses', losses,
            'saves', saves,
            'holds', holds
          ) as "pitchingStats",
          points,
          game_date as "gameDate"
        FROM player_stats 
        WHERE game_date = ${date.toISOString().split("T")[0]}::date
        ORDER BY points DESC
      `;

      return result.map((row: any) => {
        const battingStats = BattingStats.create(
          row.battingStats.atBats,
          row.battingStats.hits,
          row.battingStats.homeRuns,
          row.battingStats.rbi,
          row.battingStats.runs,
          row.battingStats.stolenBases,
          row.battingStats.strikeouts,
          row.battingStats.walks
        );

        const pitchingStats = PitchingStats.create(
          row.pitchingStats.inningsPitched,
          row.pitchingStats.earnedRuns,
          row.pitchingStats.pitchingStrikeouts,
          row.pitchingStats.hitsAllowed,
          row.pitchingStats.walksIssued,
          row.pitchingStats.wins,
          row.pitchingStats.losses,
          row.pitchingStats.saves,
          row.pitchingStats.holds,
          0 // gamesStarted is not stored in the database
        );

        return PlayerStats.create(
          row.id,
          row.name,
          row.team,
          "", // opponentTeam is not stored in the database
          row.position,
          row.points,
          battingStats,
          pitchingStats,
          new Date(row.gameDate)
        );
      });
    } catch (error: any) {
      throw new Error(
        `Failed to find player stats by date: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  async save(stats: PlayerStats): Promise<void> {
    try {
      await this.sql`
        INSERT INTO player_stats (
          player_id, name, team, position, 
          at_bats, hits, home_runs, rbis, runs, 
          stolen_bases, strikeouts, walks,
          innings_pitched, earned_runs, wins, losses,
          saves, pitching_strikeouts, hits_allowed,
          walks_issued, holds,
          points, game_date
        ) VALUES (
          ${stats.id},
          ${stats.name},
          ${stats.team},
          ${stats.position},
          ${stats.battingStats.atBats},
          ${stats.battingStats.hits},
          ${stats.battingStats.homeRuns},
          ${stats.battingStats.rbi},
          ${stats.battingStats.runs},
          ${stats.battingStats.stolenBases},
          ${stats.battingStats.strikeouts},
          ${stats.battingStats.walks},
          ${stats.pitchingStats.inningsPitched},
          ${stats.pitchingStats.earnedRuns},
          ${stats.pitchingStats.wins},
          ${stats.pitchingStats.losses},
          ${stats.pitchingStats.saves},
          ${stats.pitchingStats.pitchingStrikeouts},
          ${stats.pitchingStats.hitsAllowed},
          ${stats.pitchingStats.walksIssued},
          ${stats.pitchingStats.holds},
          ${stats.points},
          ${stats.gameDate.toISOString().split("T")[0]}
        )
      `;
    } catch (error: any) {
      throw new Error(
        `Failed to save player stats: ${error?.message || "Unknown error"}`
      );
    }
  }

  async saveBatch(stats: PlayerStats[]): Promise<void> {
    if (stats.length === 0) return;

    try {
      const columns = [
        "player_id",
        "name",
        "team",
        "position",
        "at_bats",
        "hits",
        "home_runs",
        "rbis",
        "runs",
        "stolen_bases",
        "strikeouts",
        "walks",
        "innings_pitched",
        "earned_runs",
        "wins",
        "losses",
        "saves",
        "pitching_strikeouts",
        "hits_allowed",
        "walks_issued",
        "holds",
        "points",
        "game_date",
      ];

      const valueTuples = stats.map((stat) => [
        stat.id,
        stat.name,
        stat.team,
        stat.position,
        stat.battingStats.atBats,
        stat.battingStats.hits,
        stat.battingStats.homeRuns,
        stat.battingStats.rbi,
        stat.battingStats.runs,
        stat.battingStats.stolenBases,
        stat.battingStats.strikeouts,
        stat.battingStats.walks,
        stat.pitchingStats.inningsPitched,
        stat.pitchingStats.earnedRuns,
        stat.pitchingStats.wins,
        stat.pitchingStats.losses,
        stat.pitchingStats.saves,
        stat.pitchingStats.pitchingStrikeouts,
        stat.pitchingStats.hitsAllowed,
        stat.pitchingStats.walksIssued,
        stat.pitchingStats.holds,
        stat.points,
        stat.gameDate.toISOString().split("T")[0],
      ]);

      const query = format(
        `INSERT INTO player_stats (${columns.join(", ")}) VALUES %L`,
        valueTuples
      );

      await this.sql.query(query);
    } catch (error: any) {
      throw new Error(
        `Failed to save player stats batch: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }
}
