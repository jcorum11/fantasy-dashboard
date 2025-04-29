import { NextResponse } from "next/server";
import { getPlayerStatsByDate } from "@/lib/mlb";
import {
  createTables,
  insertPlayerStats,
  getPlayerStatsByDate as getStoredStats,
} from "@/lib/db";
import { format, subDays } from "date-fns";

export async function GET() {
  try {
    console.error("=== API Route Start ===");

    // Ensure tables exist
    console.error("Creating/verifying tables...");
    await createTables();

    // Get yesterday's date
    const today = new Date();
    const yesterday = format(subDays(today, 1), "yyyy-MM-dd");
    console.error("Date to fetch:", yesterday);

    // First try to get stored stats
    console.error("Checking database for stored stats...");
    const storedStats = await getStoredStats(yesterday);
    console.error("Stored stats found:", storedStats.length);

    if (storedStats.length > 0) {
      console.error("Returning stored stats");
      return NextResponse.json({ stats: storedStats });
    }

    // If no stored stats, fetch from MLB API
    console.error("No stored stats found, fetching from MLB API...");
    const stats = await getPlayerStatsByDate(yesterday);
    console.error("MLB API stats retrieved:", stats.length);

    // Store each player's stats
    if (stats.length > 0) {
      console.error("Storing stats in database...");
      for (const playerStats of stats) {
        await insertPlayerStats(playerStats);
      }
      console.error("Stats stored in database");
    } else {
      console.error("No stats found from MLB API");
    }

    console.error("=== API Route End ===");
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("=== API Route Error ===");
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
