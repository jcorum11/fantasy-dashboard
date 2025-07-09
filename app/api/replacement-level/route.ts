import { NextResponse } from "next/server";
import { MLBStatsService } from "@/lib/mlb/services/MLBStatsService";

export async function GET() {
  try {
    // Determine the relevant MLB season
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // MLB season typically runs from March to October
    // If we're in the off-season (November through February), use the previous year's stats
    const relevantSeason =
      currentMonth >= 11 || currentMonth <= 2 ? currentYear - 1 : currentYear;

    const statsService = new MLBStatsService();
    const players = await statsService.fetchSeasonStats(relevantSeason);

    if (players.length === 0) {
      return NextResponse.json(
        { message: "No player data available for the current season" },
        { status: 200 }
      );
    }

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching top performers:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      { error: "Failed to fetch top performers" },
      { status: 500 }
    );
  }
}
