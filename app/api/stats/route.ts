import { NextResponse } from "next/server";
import { getPlayerStatsByDate } from "@/lib/mlb/playerStats";
import {
  createTables,
  insertPlayerStats,
  getPlayerStatsByDate as getStoredStats,
} from "@/lib/db";
import {
  isValidDateFormat,
  getYesterdayMLB,
  getGameAvailabilityMessage,
} from "@/lib/mlb/dates";

export async function GET(request: Request) {
  try {
    // Get date from query parameter or default to yesterday
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    // Parse the requested date
    let targetDate: string;
    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      if (!isValidDateFormat(dateParam)) {
        console.error(
          "Invalid date format. Expected YYYY-MM-DD, got:",
          dateParam
        );
        return NextResponse.json(
          {
            error:
              "Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-03-28).",
            stats: [],
            date: dateParam,
          },
          { status: 400 }
        );
      }

      targetDate = dateParam;
    } else {
      // Default to yesterday in MLB timezone
      targetDate = getYesterdayMLB();
    }

    // Check if we should bypass the database cache
    const nocache = url.searchParams.get("nocache");

    // If nocache is not set, try to get stored stats
    let stats = [];
    if (!nocache) {
      // Ensure tables exist
      await createTables();

      // Try to get stored stats
      const storedStats = await getStoredStats(targetDate);

      if (storedStats.length > 0) {
        return NextResponse.json({ stats: storedStats, date: targetDate });
      }
    }
    // Fetch from MLB API
    stats = await getPlayerStatsByDate(targetDate);

    // Store the stats in the database for future use
    if (stats.length > 0) {
      // Insert each player's stats individually
      for (const playerStats of stats) {
        await insertPlayerStats(playerStats);
      }
      return NextResponse.json({ stats, date: targetDate });
    } else {
      return NextResponse.json({
        stats: [],
        date: targetDate,
        message: getGameAvailabilityMessage(targetDate),
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
