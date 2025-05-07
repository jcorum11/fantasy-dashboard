import { IMLBClient } from "../../domain/interfaces/IMLBClient";
import { MLBGame } from "../../domain/models/MLBGame";
import { MLBBoxScore, MLBScheduleResponse } from "../../../lib/types/mlb";
import { isValidDateFormat } from "../../../lib/mlb/dates";

export class MLBClient implements IMLBClient {
  private readonly baseUrl = "https://statsapi.mlb.com/api/v1";

  /**
   * Get all games for a specific date
   * @param date The date in YYYY-MM-DD format
   * @returns Promise<MLBGame[]> Array of games for the date
   */
  async getGamesByDate(date: string): Promise<MLBGame[]> {
    if (!isValidDateFormat(date)) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/schedule?date=${date}&sportId=1`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.statusText}`);
      }

      const data: MLBScheduleResponse = await response.json();
      if (!data.dates || data.dates.length === 0) {
        return [];
      }

      return data.dates[0].games.map((game) =>
        MLBGame.create(
          game.gamePk,
          game.gameType,
          game.season,
          game.gameDate,
          game.status,
          game.teams.away,
          game.teams.home,
          game.venue
        )
      );
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }

  /**
   * Get the boxscore for a specific game
   * @param gameId The MLB game ID
   * @returns Promise<MLBBoxScore> The game's boxscore
   */
  async getGameBoxScore(gameId: number): Promise<MLBBoxScore> {
    try {
      const response = await fetch(`${this.baseUrl}/game/${gameId}/boxscore`);
      if (!response.ok) {
        throw new Error(`Failed to fetch boxscore: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching boxscore for game ${gameId}:`, error);
      throw error;
    }
  }
}
