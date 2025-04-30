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
  getMLBDate,
} from "@/lib/mlb/dates";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    console.log("DEBUG: API route called");
    console.log("DEBUG: Request URL:", request.url);
    console.log("DEBUG: Request method:", request.method);
    console.log(
      "DEBUG: Request headers:",
      JSON.stringify(Object.fromEntries(request.headers))
    );

    console.error("=== API Route Start ===");
    console.error("Environment variables check:");
    console.error("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.error("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

    // Get date from query parameter or default to yesterday
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    console.log("DEBUG: Date parameter from URL:", dateParam);

    const today = new Date();
    console.log("DEBUG: Today's date:", today);
    console.log("DEBUG: Today's date ISO string:", today.toISOString());
    console.log("DEBUG: Today's date local string:", today.toString());

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
      console.log("DEBUG: Using date parameter directly:", targetDate);
    } else {
      // Default to yesterday in MLB timezone
      targetDate = getYesterdayMLB();
      console.log("DEBUG: Using default date (yesterday):", targetDate);
    }

    // Create a Date object for comparison
    const requestedDate = new Date(targetDate + "T00:00:00Z");
    console.error("Date to fetch:", targetDate);
    console.error("Requested date object:", requestedDate);
    console.error(
      "Requested date formatted:",
      format(requestedDate, "MMMM d, yyyy")
    );

    // Check if we should bypass the database cache
    const nocache = url.searchParams.get("nocache");
    console.log("DEBUG: No cache parameter:", nocache);

    // If nocache is not set, try to get stored stats
    let stats = [];
    if (!nocache) {
      // Ensure tables exist
      console.error("Creating/verifying tables...");
      await createTables();

      // Try to get stored stats
      console.error("Checking database for stored stats...");
      const storedStats = await getStoredStats(targetDate);
      console.error("Stored stats found:", storedStats.length);

      if (storedStats.length > 0) {
        console.error("Returning stored stats");
        return NextResponse.json({ stats: storedStats, date: targetDate });
      }
    } else {
      console.error("Cache bypass requested, fetching fresh data from MLB API");
    }

    // Fetch from MLB API
    console.error(
      "No stored stats found or cache bypass requested, fetching from MLB API..."
    );
    stats = await getPlayerStatsByDate(targetDate);
    console.error("MLB API stats retrieved:", stats.length);

    // Store the stats in the database for future use
    if (stats.length > 0) {
      console.error("Storing stats in database...");
      // Insert each player's stats individually
      for (const playerStats of stats) {
        await insertPlayerStats(playerStats);
      }
      console.error("Stats stored in database");
      return NextResponse.json({ stats, date: targetDate });
    } else {
      console.error("No stats found from MLB API");
      return NextResponse.json({
        stats: [],
        date: targetDate,
        message: getGameAvailabilityMessage(targetDate),
      });
    }
  } catch (error) {
    console.error("=== API Route Error ===");
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
