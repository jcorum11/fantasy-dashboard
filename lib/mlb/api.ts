import axios from "axios";
import { format } from "date-fns";
import { MLBBoxScore, MLBScheduleResponse } from "../types/mlb";
import { isValidDateFormat } from "./dates";

const MLB_STATS_API = "https://statsapi.mlb.com/api/v1";

/**
 * Get MLB games for a specific date
 */
export async function getGamesByDate(date: string) {
  try {
    // Validate date format
    if (!isValidDateFormat(date)) {
      console.error(
        "Invalid date format in getGamesByDate. Expected YYYY-MM-DD, got:",
        date
      );
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
    }

    // Parse the date
    const [year, month, day] = date.split("-").map(Number);

    // Check if it's in the future
    const requestedDate = new Date(year, month - 1, day);
    const today = new Date();

    if (requestedDate > today) {
      return [];
    }

    // Log the full URL for debugging
    const url = `${MLB_STATS_API}/schedule/games/?sportId=1&date=${date}&hydrate=team`;

    const response = await axios.get<MLBScheduleResponse>(url);
    return response.data.dates[0]?.games || [];
  } catch (error) {
    console.error("=== MLB: Error Getting Games ===");
    console.error("Error details:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error response:", error.response?.data);
      console.error("Axios error status:", error.response?.status);
      console.error("Axios error URL:", error.config?.url);
    }
    throw error;
  }
}

/**
 * Get box score for a specific game
 */
export async function getGameBoxScore(gamePk: number): Promise<MLBBoxScore> {
  try {
    const url = `${MLB_STATS_API}/game/${gamePk}/boxscore?hydrate=team,team.teamName,team.teamId,player,player.person,player.position,player.stats,player.stats.batting,player.stats.pitching`;
    console.log("Fetching box score from:", url);
    const response = await axios.get(url);
    console.log("Box score response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`Error fetching box score for game ${gamePk}:`, error);
    throw error;
  }
}
