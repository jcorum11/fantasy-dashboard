import { IMLBClient } from "../../domain/interfaces/IMLBClient";
import { PlayerStats } from "../../domain/models/PlayerStats";
import { MLBBoxScore } from "../../../lib/types/mlb";
import {
  calculateBattingPoints,
  calculatePitchingPoints,
} from "../../../lib/mlb/points";
import { BattingStats } from "../../domain/models/BattingStats";
import { PitchingStats } from "../../domain/models/PitchingStats";
import { IPlayerStatsRepository } from "../../domain/repositories/IPlayerStatsRepository";
import { PostgresPlayerStatsRepository } from "../../infrastructure/repositories/PostgresPlayerStatsRepository";

export class PlayerStatsService {
  private repository: IPlayerStatsRepository | null = null;

  constructor(private readonly mlbClient: IMLBClient, databaseUrl?: string) {
    if (databaseUrl) {
      this.repository = new PostgresPlayerStatsRepository(databaseUrl);
    }
  }

  async initializeDatabase(): Promise<void> {
    if (!this.repository) {
      throw new Error("Database URL not provided");
    }
    await this.repository.createTables();
  }

  async savePlayerStats(stats: PlayerStats): Promise<void> {
    if (!this.repository) {
      throw new Error("Database URL not provided");
    }
    await this.repository.save(stats);
  }

  async savePlayerStatsBatch(stats: PlayerStats[]): Promise<void> {
    if (!this.repository) {
      throw new Error("Database URL not provided");
    }
    await this.repository.saveBatch(stats);
  }

  /**
   * Get player stats for a specific date
   * @param date The date in YYYY-MM-DD format or Date object
   * @returns Promise<PlayerStats[]> Array of player stats for the date
   */
  async getPlayerStatsByDate(date: string | Date): Promise<PlayerStats[]> {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    const games = await this.mlbClient.getGamesByDate(dateStr);
    const allPlayerStats: PlayerStats[] = [];

    for (const game of games) {
      try {
        const boxscore = await this.mlbClient.getGameBoxScore(game.gameId);
        const gamePlayerStats = this.processPlayerStats(boxscore, dateStr);
        allPlayerStats.push(...gamePlayerStats);
      } catch (error) {
        console.error(`Error processing game ${game.gameId}:`, error);
        // Continue with other games even if one fails
      }
    }

    return allPlayerStats;
  }

  /**
   * Process player stats from a boxscore
   * @param boxscore The game's boxscore
   * @param gameDate The date of the game
   * @returns PlayerStats[] Array of player stats
   */
  private processPlayerStats(
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
        let pitchingStats = PitchingStats.create(
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          null,
          0
        );

        if (player.stats?.batting?.gamesPlayed) {
          const stats = {
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
          const stats = {
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

        if (points !== 0) {
          playerStats.push(
            PlayerStats.create(
              player.person.id,
              player.person.fullName,
              team.team.abbreviation,
              opponentTeam.abbreviation,
              player.position?.abbreviation || "Unknown",
              points,
              battingStats,
              pitchingStats,
              gameDateObj,
              false,
              teamType === "home"
            )
          );
        }
      });
    });

    return playerStats;
  }
}
