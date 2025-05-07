import { MLBBoxScore } from "../types/mlb";
import { getGamesByDate, getGameBoxScore } from "./api";
import { isValidDateFormat } from "./dates";
import { PlayerStats } from "../../src/domain/models/PlayerStats";
import { BattingStats } from "../../src/domain/models/BattingStats";
import { PitchingStats } from "../../src/domain/models/PitchingStats";
import {
  extractBattingStats,
  extractPitchingStats,
  calculateBattingPointsFromRaw,
  calculatePitchingPointsFromRaw,
  createBattingStats,
  createPitchingStats,
} from "./statsProcessing";
import { determinePlayerPosition, hasRelevantStats } from "./playerUtils";

interface PlayerGameStats {
  points: number;
  battingStats: BattingStats;
  pitchingStats: PitchingStats;
}

function processPlayerGameStats(player: any): PlayerGameStats {
  let points = 0;
  let battingStats = BattingStats.create(0, 0, 0, 0, 0, 0, 0, 0);
  let pitchingStats = PitchingStats.create(0, 0, 0, 0, 0, 0, 0, 0, null, 0);

  if (player.stats?.batting?.gamesPlayed) {
    const rawBattingStats = extractBattingStats(player);
    points += calculateBattingPointsFromRaw(rawBattingStats);
    battingStats = createBattingStats(rawBattingStats);
  }

  if (player.stats?.pitching?.gamesPlayed) {
    const rawPitchingStats = extractPitchingStats(player);
    points += calculatePitchingPointsFromRaw(rawPitchingStats);
    pitchingStats = createPitchingStats(rawPitchingStats);
  }

  return { points, battingStats, pitchingStats };
}

function processPlayerStats(
  boxscore: MLBBoxScore,
  gameDate: string
): PlayerStats[] {
  const playerStats: PlayerStats[] = [];
  const awayTeam = boxscore.teams.away.team;
  const homeTeam = boxscore.teams.home.team;
  const gameDateObj = new Date(gameDate);

  ["away", "home"].forEach((teamType) => {
    const team = boxscore.teams[teamType as keyof typeof boxscore.teams];
    const players = Object.values(team.players);
    const opponentTeam = teamType === "away" ? homeTeam : awayTeam;

    players.forEach((player) => {
      const stats = processPlayerGameStats(player);

      if (hasRelevantStats(stats.battingStats, stats.pitchingStats)) {
        const position = determinePlayerPosition(player, stats.pitchingStats);
        const isPitcher = ["SP", "RP", "P"].includes(position);
        const isPositionPlayerPitching =
          !isPitcher && stats.pitchingStats.inningsPitched > 0;

        const playerStat = PlayerStats.create(
          player.person.id,
          player.person.fullName,
          team.team.abbreviation || team.team.name,
          opponentTeam.abbreviation || opponentTeam.name,
          position,
          stats.points,
          stats.battingStats,
          stats.pitchingStats,
          gameDateObj,
          isPositionPlayerPitching
        );
        playerStats.push(playerStat);
      }
    });
  });

  return playerStats;
}

export async function getPlayerStatsByDate(
  date: string
): Promise<PlayerStats[]> {
  if (!isValidDateFormat(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
  }

  const games = await getGamesByDate(date);
  if (games.length === 0) {
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
    }
  }

  return allPlayerStats;
}
