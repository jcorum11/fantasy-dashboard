import axios from "axios";
import { format } from "date-fns";
import { MLBBoxScore, MLBScheduleResponse } from "../types/mlb";
import { isValidDateFormat } from "./dates";

const MLB_STATS_API = "https://statsapi.mlb.com/api/v1";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${MLB_STATS_API}/game/${gamePk}/boxscore?hydrate=team,team.teamName,team.teamId,player,player.person,player.position,player.stats,player.stats.batting,player.stats.pitching`;
      console.log(
        `Attempt ${attempt}/${MAX_RETRIES}: Fetching box score from:`,
        url
      );

      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
      });

      // Check if response data is valid
      if (!response.data || !response.data.teams) {
        const error = new Error("Invalid response data structure from MLB API");
        (error as any).userMessage =
          "Unable to fetch game data. Please try again later.";
        throw error;
      }

      // Check if teams have data
      if (!response.data.teams.away || !response.data.teams.home) {
        const error = new Error("Missing team data in MLB API response");
        (error as any).userMessage =
          "Game data is incomplete. Please try again later.";
        throw error;
      }

      console.log(
        "Box score response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          headers: error.config?.headers,
        });

        // Add user-friendly error messages based on the status code
        const status = error.response?.status;
        if (status === 429) {
          (error as any).userMessage =
            "Too many requests. Please try again in a few minutes.";
        } else if (status && status >= 500) {
          (error as any).userMessage =
            "MLB API is currently unavailable. Please try again later.";
        } else if (status === 404) {
          (error as any).userMessage =
            "Game data not found. This game may not be available yet.";
        } else if (error.code === "ECONNABORTED") {
          (error as any).userMessage = "Request timed out. Please try again.";
        } else {
          (error as any).userMessage =
            "Unable to fetch game data. Please try again later.";
        }

        // If it's a 429 (Too Many Requests) or 5xx error, retry
        if (status === 429 || (status && status >= 500 && status < 600)) {
          if (attempt < MAX_RETRIES) {
            console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
            await sleep(RETRY_DELAY);
            continue;
          }
        }
      } else {
        // For non-Axios errors, add a generic user message
        console.error("=== MLB: Non-Axios Error Details ===");
        const typedError = error as Error;
        console.error("Error type:", typedError.constructor.name);
        console.error("Error message:", typedError.message);
        console.error("Error stack:", typedError.stack);
        console.error("Error object:", JSON.stringify(typedError, null, 2));

        (error as any).userMessage =
          "An unexpected error occurred. Please try again later.";
      }

      // For other errors, don't retry
      throw error;
    }
  }

  // If we've exhausted all retries, add a user message to the lastError
  if (lastError) {
    console.error("=== MLB: All Retries Failed ===");
    console.error("Final error:", lastError);
    const typedLastError = lastError as Error;
    console.error("Error type:", typedLastError.constructor.name);
    console.error("Error message:", typedLastError.message);
    console.error("Error stack:", typedLastError.stack);
    console.error("Error object:", JSON.stringify(typedLastError, null, 2));

    (lastError as any).userMessage =
      "Unable to fetch game data after multiple attempts. Please try again later.";
  }
  throw lastError;
}
