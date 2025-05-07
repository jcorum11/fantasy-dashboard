import { PlayerStats } from "../../domain/models/PlayerStats";

export interface PlayerStatsResponse {
  stats: PlayerStats[];
  error?: string;
  message?: string;
  date: string;
}

export class PlayerStatsClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  }

  async getPlayerStats(date?: string): Promise<PlayerStatsResponse> {
    const url = new URL(`${this.baseUrl}/api/stats`);
    if (date) {
      url.searchParams.append("date", date);
    }
    // Add a cache-busting parameter
    url.searchParams.append("nocache", Date.now().toString());

    try {
      const response = await fetch(url.toString(), {
        cache: "no-store", // Disable caching
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          stats: [],
          error: errorData.error || "Failed to fetch stats",
          date: date || "",
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      return {
        stats: [],
        error: "Network error. Please try again later.",
        date: date || "",
      };
    }
  }
}
