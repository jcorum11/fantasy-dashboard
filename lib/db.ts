import { neon, neonConfig } from "@neondatabase/serverless";
import format from "pg-format";

export type PlayerStats = {
  id: number;
  name: string;
  team: string;
  opponentTeam: string;
  position: string;
  points: number;
  battingStats: {
    atBats: number;
    hits: number;
    homeRuns: number;
    rbi: number;
    runs: number;
    stolenBases: number;
    strikeouts: number;
    walks: number;
  };
  pitchingStats: {
    inningsPitched: number;
    earnedRuns: number;
    pitchingStrikeouts: number;
    hitsAllowed: number;
    walksIssued: number;
    wins: number;
    losses: number;
    saves: number;
    holds: number | null;
    gamesStarted: number;
  };
  gameDate: string;
};

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Create SQL client
const sql = neon(process.env.DATABASE_URL!);

export async function createTables() {
  try {
    await sql`
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
  } catch (error) {
    throw error;
  }
}

export async function insertPlayerStats(stats: PlayerStats) {
  try {
    await sql`
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
        ${stats.gameDate}
      )
    `;
  } catch (error) {
    throw error;
  }
}

export async function insertPlayerStatsBatch(statsArray: PlayerStats[]) {
  if (statsArray.length === 0) return;
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
    const valueTuples = statsArray.map((stats) => [
      stats.id,
      stats.name,
      stats.team,
      stats.position,
      stats.battingStats.atBats,
      stats.battingStats.hits,
      stats.battingStats.homeRuns,
      stats.battingStats.rbi,
      stats.battingStats.runs,
      stats.battingStats.stolenBases,
      stats.battingStats.strikeouts,
      stats.battingStats.walks,
      stats.pitchingStats.inningsPitched,
      stats.pitchingStats.earnedRuns,
      stats.pitchingStats.wins,
      stats.pitchingStats.losses,
      stats.pitchingStats.saves,
      stats.pitchingStats.pitchingStrikeouts,
      stats.pitchingStats.hitsAllowed,
      stats.pitchingStats.walksIssued,
      stats.pitchingStats.holds,
      stats.points,
      stats.gameDate,
    ]);
    const query = format(
      `INSERT INTO player_stats (
        ${columns.join(", ")}
      ) VALUES %L`,
      valueTuples
    );
    await sql.query(query);
  } catch (error) {
    throw error;
  }
}

export async function getPlayerStatsByDate(date: string) {
  try {
    const result = await sql`
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
      WHERE game_date = ${date}::date
      ORDER BY points DESC
    `;
    return result;
  } catch (error) {
    throw error;
  }
}
