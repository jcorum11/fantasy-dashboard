import { MLBBoxScore, MLBStats } from "../types/mlb";
import { calculateBattingPoints, calculatePitchingPoints } from "./points";
import { getGamesByDate, getGameBoxScore } from "./api";
import { isValidDateFormat } from "./dates";
import { BattingStats } from "../../src/domain/models/BattingStats";
import { PitchingStats } from "../../src/domain/models/PitchingStats";
import { PlayerStats } from "../../src/domain/models/PlayerStats";

/**
 * Process player stats from a boxscore
 */
function processPlayerStats(
  boxscore: MLBBoxScore,
  gameDate: string
): PlayerStats[] {
  const playerStats: PlayerStats[] = [];
  const awayTeam = boxscore.teams.away.team;
  const homeTeam = boxscore.teams.home.team;
  const gameDateObj = new Date(gameDate);

  // Process both teams
  ["away", "home"].forEach((teamType) => {
    const team = boxscore.teams[teamType as keyof typeof boxscore.teams];
    const players = Object.values(team.players);
    const opponentTeam = teamType === "away" ? homeTeam : awayTeam;

    // Process each player
    players.forEach((player) => {
      let points = 0;
      let battingStats = BattingStats.create(0, 0, 0, 0, 0, 0, 0, 0);
      let pitchingStats = PitchingStats.create(0, 0, 0, 0, 0, 0, 0, 0, null, 0);

      if (player.stats?.batting?.gamesPlayed) {
        const stats: MLBStats = {
          atBats: player.stats.batting.atBats,
          hits: player.stats.batting.hits,
          doubles: player.stats.batting.doubles,
          triples: player.stats.batting.triples,
          homeRuns: player.stats.batting.homeRuns,
          rbi: player.stats.batting.rbi,
          runs: player.stats.batting.runs,
          stolenBases: player.stats.batting.stolenBases,
          strikeouts: player.stats.batting.strikeOuts,
          walks: player.stats.batting.baseOnBalls,
        };
        points += calculateBattingPoints(stats);
        battingStats = BattingStats.create(
          stats.atBats || 0,
          stats.hits || 0,
          stats.homeRuns || 0,
          stats.rbi || 0,
          stats.runs || 0,
          stats.stolenBases || 0,
          stats.strikeouts || 0,
          stats.walks || 0
        );
      }

      if (player.stats?.pitching?.gamesPlayed) {
        const stats: MLBStats = {
          inningsPitched: player.stats.pitching.inningsPitched,
          earnedRuns: player.stats.pitching.earnedRuns,
          pitchingStrikeouts: player.stats.pitching.strikeOuts,
          hitsAllowed: player.stats.pitching.hits,
          walksIssued: player.stats.pitching.baseOnBalls,
          wins: player.stats.pitching.wins,
          losses: player.stats.pitching.losses,
          saves: player.stats.pitching.saves,
          holds: player.stats.pitching.holds,
          gamesStarted: player.stats.pitching.gamesStarted || 0,
        };
        points += calculatePitchingPoints(stats);
        pitchingStats = PitchingStats.create(
          stats.inningsPitched ? parseFloat(stats.inningsPitched) : 0,
          stats.earnedRuns || 0,
          stats.pitchingStrikeouts || 0,
          stats.hitsAllowed || 0,
          stats.walksIssued || 0,
          stats.wins || 0,
          stats.losses || 0,
          stats.saves || 0,
          stats.holds === undefined ? null : stats.holds,
          stats.gamesStarted || 0
        );
      }

      // Only add players who have stats
      if (
        battingStats.atBats > 0 ||
        battingStats.walks > 0 ||
        battingStats.strikeouts > 0 ||
        pitchingStats.inningsPitched > 0 ||
        pitchingStats.pitchingStrikeouts > 0
      ) {
        // For pitchers, determine if they're a starter or reliever based on their stats
        let position = player.position.abbreviation;
        if (player.stats?.pitching?.gamesPlayed) {
          // If they started the game, they're a starter
          if (player.stats.pitching.gamesStarted > 0) {
            position = "SP";
          }
          // If they have a save or hold, they're a reliever
          else if (pitchingStats.saves > 0 || pitchingStats.holds !== null) {
            position = "RP";
          }
          // If they pitched more than 4 innings, they're likely a starter
          else {
            position = pitchingStats.inningsPitched >= 4 ? "SP" : "RP";
          }
        }
        const isPitcher = ["SP", "RP", "P"].includes(position);
        const isPositionPlayerPitching =
          !isPitcher && pitchingStats.inningsPitched > 0;
        const playerStat = PlayerStats.create(
          player.person.id,
          player.person.fullName,
          team.team.abbreviation || team.team.name,
          opponentTeam.abbreviation || opponentTeam.name,
          position,
          points,
          battingStats,
          pitchingStats,
          gameDateObj,
          isPositionPlayerPitching
        );
        playerStats.push(playerStat);
      }
    });
  });

  return playerStats;
}

/**
 * Get player stats for a specific date
 */
export async function getPlayerStatsByDate(
  date: string
): Promise<PlayerStats[]> {
  try {
    // Validate date format
    if (!isValidDateFormat(date)) {
      console.error(
        "Invalid date format in getPlayerStatsByDate. Expected YYYY-MM-DD, got:",
        date
      );
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
    }

    const games = await getGamesByDate(date);

    if (games.length === 0) {
      console.error(`No games found for date ${date}`);
      return [];
    }

    const allPlayerStats: PlayerStats[] = [];

    for (const game of games) {
      try {
        const boxscore = await getGameBoxScore(game.gamePk);
        const gamePlayerStats = processPlayerStats(boxscore, date);
        allPlayerStats.push(...gamePlayerStats);
      } catch (gameError) {
        console.error(`Error processing game ${game.gamePk}:`, gameError);
        // Continue with other games even if one fails
      }
    }

    return allPlayerStats;
  } catch (error) {
    console.error("Error details:", error);
    throw error;
  }
}
