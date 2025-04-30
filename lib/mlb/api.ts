import axios from "axios";
import { format } from "date-fns";
import { MLBBoxScore, MLBScheduleResponse } from "../types/mlb";
import { isValidDateFormat, MLB_SEASON } from "./dates";

const MLB_STATS_API = "https://statsapi.mlb.com/api/v1";

/**
 * Get MLB games for a specific date
 */
export async function getGamesByDate(date: string) {
  try {
    console.log("DEBUG: getGamesByDate called with date:", date);

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
    console.error("Parsed date:", { year, month, day });

    // Check if it's within the MLB season
    const isBeforeSeason =
      month < MLB_SEASON.START_MONTH ||
      (month === MLB_SEASON.START_MONTH && day < MLB_SEASON.START_DAY);
    const isAfterSeason = month > MLB_SEASON.END_MONTH;

    if (isBeforeSeason || isAfterSeason) {
      console.error("Date is outside MLB season");
      return [];
    }

    console.error("=== MLB: Getting Games ===");
    console.error("Date:", date);

    // Log the full URL for debugging
    const url = `${MLB_STATS_API}/schedule/games/?sportId=1&date=${date}&hydrate=team`;
    console.error("MLB API URL:", url);

    const response = await axios.get<MLBScheduleResponse>(url);
    return response.data.dates[0]?.games || [];
  } catch (error) {
    console.error("=== MLB: Error Getting Games ===");
    console.error("Error details:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error response:", error.response?.data);
      console.error("Axios error status:", error.response?.status);
    }
    throw error;
  }
}

/**
 * Get box score for a specific game
 */
export async function getGameBoxScore(gamePk: number): Promise<MLBBoxScore> {
  try {
    const url = `${MLB_STATS_API}/game/${gamePk}/boxscore?fields=teams,teams.team,teams.players,teams.players.stats,teams.players.person,teams.players.position`;
    console.error("Fetching box score from:", url);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching box score for game ${gamePk}:`, error);
    throw error;
  }
}
