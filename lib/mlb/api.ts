import axios, { AxiosInstance, AxiosError } from "axios";
import { MLBBoxScore, MLBScheduleResponse } from "../types/mlb";
import { isValidDateFormat, getMLBDate } from "./dates";

// Configuration interface
interface MLBAPIConfig {
  baseUrl: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

// Default configuration
const DEFAULT_CONFIG: MLBAPIConfig = {
  baseUrl: "https://statsapi.mlb.com/api/v1",
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
};

// Error types
class MLBAPIError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "MLBAPIError";
  }
}

// MLB API Client class
class MLBAPIClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: MLBAPIConfig;

  constructor(config: Partial<MLBAPIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      let userMessage = "Unable to fetch game data. Please try again later.";

      if (status === 429) {
        userMessage = "Too many requests. Please try again in a few minutes.";
      } else if (status && status >= 500) {
        userMessage =
          "MLB API is currently unavailable. Please try again later.";
      } else if (status === 404) {
        userMessage =
          "Game data not found. This game may not be available yet.";
      } else if (axiosError.code === "ECONNABORTED") {
        userMessage = "Request timed out. Please try again.";
      }

      throw new MLBAPIError(
        `MLB API Error in ${context}: ${axiosError.message}`,
        userMessage,
        axiosError
      );
    }

    throw new MLBAPIError(
      `Unexpected error in ${context}`,
      "An unexpected error occurred. Please try again later.",
      error as Error
    );
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(
          `Attempt ${attempt}/${this.config.maxRetries} failed:`,
          error
        );

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelay);
          continue;
        }
      }
    }

    throw new MLBAPIError(
      `All retries failed in ${context}`,
      "Unable to fetch game data after multiple attempts. Please try again later.",
      lastError
    );
  }

  async getGamesByDate(date: string): Promise<any[]> {
    if (!isValidDateFormat(date)) {
      throw new MLBAPIError(
        `Invalid date format: ${date}`,
        "Invalid date format. Expected YYYY-MM-DD."
      );
    }

    const [year, month, day] = date.split("-").map(Number);
    const requestedDate = new Date(year, month - 1, day);
    const today = getMLBDate();

    if (requestedDate > today) {
      return [];
    }

    return this.retryOperation(async () => {
      const response = await this.axiosInstance.get<MLBScheduleResponse>(
        `/schedule/games/?sportId=1&date=${date}&hydrate=team`
      );
      return response.data.dates[0]?.games || [];
    }, "getGamesByDate");
  }

  async getGameBoxScore(gamePk: number): Promise<MLBBoxScore> {
    return this.retryOperation(async () => {
      const response = await this.axiosInstance.get(
        `/game/${gamePk}/boxscore?hydrate=team,team.teamName,team.teamId,player,player.person,player.position,player.stats,player.stats.batting,player.stats.pitching`
      );

      if (!response.data?.teams?.away || !response.data?.teams?.home) {
        throw new MLBAPIError(
          "Invalid response data structure",
          "Game data is incomplete. Please try again later."
        );
      }

      return response.data;
    }, "getGameBoxScore");
  }
}

// Export a singleton instance
export const mlbClient = new MLBAPIClient();

// Export convenience functions
export const getGamesByDate = (date: string) => mlbClient.getGamesByDate(date);
export const getGameBoxScore = (gamePk: number) =>
  mlbClient.getGameBoxScore(gamePk);

// Export the client class for testing and customization
export { MLBAPIClient, MLBAPIError, type MLBAPIConfig };
