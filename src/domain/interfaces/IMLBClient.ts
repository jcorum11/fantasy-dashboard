import { MLBGame } from "../models/MLBGame";
import { MLBBoxScore } from "../../../lib/types/mlb";

export interface IMLBClient {
  /**
   * Get all games for a specific date
   * @param date The date in YYYY-MM-DD format
   * @returns Promise<MLBGame[]> Array of games for the date
   */
  getGamesByDate(date: string): Promise<MLBGame[]>;

  /**
   * Get the boxscore for a specific game
   * @param gameId The MLB game ID
   * @returns Promise<MLBBoxScore> The game's boxscore
   */
  getGameBoxScore(gameId: number): Promise<MLBBoxScore>;
}
