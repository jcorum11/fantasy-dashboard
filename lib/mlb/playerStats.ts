import { PlayerStats } from "../db";
import { MLBBoxScore, MLBStats } from "../types/mlb";
import { calculateBattingPoints, calculatePitchingPoints } from "./points";
import { getGamesByDate, getGameBoxScore } from "./api";
import { isValidDateFormat } from "./dates";

/**
 * Process player stats from a boxscore
 */
function processPlayerStats(
  boxscore: MLBBoxScore,
  gameDate: string
): PlayerStats[] {
  const playerStats: PlayerStats[] = [];

  // Process both teams
  ["away", "home"].forEach((teamType) => {
    const team = boxscore.teams[teamType as keyof typeof boxscore.teams];
    const players = Object.values(team.players);

    // Process each player
    players.forEach((player) => {
      let points = 0;
      let battingStats = {
        atBats: 0,
        hits: 0,
        homeRuns: 0,
        rbi: 0,
        runs: 0,
        stolenBases: 0,
        strikeouts: 0,
        walks: 0,
      };

      let pitchingStats: PlayerStats["pitchingStats"] = {
        inningsPitched: 0,
        earnedRuns: 0,
        pitchingStrikeouts: 0,
        hitsAllowed: 0,
        walksIssued: 0,
        wins: 0,
        losses: 0,
        saves: 0,
        holds: null,
      };

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
        battingStats = {
          atBats: stats.atBats || 0,
          hits: stats.hits || 0,
          homeRuns: stats.homeRuns || 0,
          rbi: stats.rbi || 0,
          runs: stats.runs || 0,
          stolenBases: stats.stolenBases || 0,
          strikeouts: stats.strikeouts || 0,
          walks: stats.walks || 0,
        };
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
        };
        points += calculatePitchingPoints(stats);
        pitchingStats = {
          inningsPitched: stats.inningsPitched
            ? parseFloat(stats.inningsPitched)
            : 0,
          earnedRuns: stats.earnedRuns || 0,
          pitchingStrikeouts: stats.pitchingStrikeouts || 0,
          hitsAllowed: stats.hitsAllowed || 0,
          walksIssued: stats.walksIssued || 0,
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          saves: stats.saves || 0,
          holds: stats.holds === undefined ? null : stats.holds,
        };
      }

      // Only add players who have stats
      if (
        battingStats.atBats > 0 ||
        battingStats.walks > 0 ||
        battingStats.strikeouts > 0 ||
        pitchingStats.inningsPitched > 0 ||
        pitchingStats.pitchingStrikeouts > 0
      ) {
        playerStats.push({
          id: player.person.id,
          name: player.person.fullName,
          team: team.team.name,
          position: player.position.abbreviation,
          points,
          battingStats,
          pitchingStats,
          gameDate,
        });
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
