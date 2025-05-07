import { NextResponse } from "next/server";
import { getPlayerStatsByDate } from "@/lib/mlb/playerStats";
import {
  createTables,
  insertPlayerStats,
  insertPlayerStatsBatch,
  getPlayerStatsByDate as getStoredStats,
} from "@/lib/db";
import {
  isValidDateFormat,
  getYesterdayMLB,
  getGameAvailabilityMessage,
  getMLBDate,
} from "@/lib/mlb/dates";

export async function GET(request: Request) {
  const apiStart = Date.now();
  console.log("[API PERF] /api/stats start at", apiStart);
  // Get date from query parameter or default to yesterday
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  let targetDate: string = getYesterdayMLB();

  try {
    // Parse the requested date
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
    }

    // Check if we should bypass the database cache
    const nocache = url.searchParams.get("nocache");

    // If nocache is not set, try to get stored stats
    let stats = [];
    if (!nocache) {
      // Ensure tables exist
      await createTables();

      // Try to get stored stats
      const dbFetchStart = Date.now();
      const storedStats = await getStoredStats(targetDate);
      const dbFetchEnd = Date.now();
      console.log(
        "[API PERF] DB fetch duration:",
        dbFetchEnd - dbFetchStart,
        "ms"
      );

      if (storedStats.length > 0) {
        const apiEnd = Date.now();
        console.log(
          "[API PERF] /api/stats total duration (from DB):",
          apiEnd - apiStart,
          "ms"
        );
        return NextResponse.json({ stats: storedStats, date: targetDate });
      }
    }
    // Fetch from MLB API
    const mlbFetchStart = Date.now();
    stats = await getPlayerStatsByDate(targetDate);
    const mlbFetchEnd = Date.now();
    console.log(
      "[API PERF] MLB API fetch duration:",
      mlbFetchEnd - mlbFetchStart,
      "ms"
    );

    // Store the stats in the database for future use
    if (stats.length > 0) {
      // Only insert into DB if the date is not today
      const todayMLB = getMLBDate();
      const todayStr = todayMLB.toISOString().slice(0, 10);
      if (targetDate !== todayStr) {
        await insertPlayerStatsBatch(stats);
      }
      const apiEnd = Date.now();
      console.log(
        "[API PERF] /api/stats total duration (from MLB API):",
        apiEnd - apiStart,
        "ms"
      );
      return NextResponse.json({ stats, date: targetDate });
    } else {
      const apiEnd = Date.now();
      console.log(
        "[API PERF] /api/stats total duration (no stats):",
        apiEnd - apiStart,
        "ms"
      );
      return NextResponse.json({
        stats: [],
        date: targetDate,
        message: getGameAvailabilityMessage(targetDate),
      });
    }
  } catch (error) {
    console.error("Error in stats API:", error);

    // Create a detailed error response
    const errorResponse = {
      error: "Failed to fetch stats",
      details:
        error instanceof Error
          ? {
              message: error.message,
              stack:
                process.env.NODE_ENV === "development"
                  ? error.stack
                  : undefined,
              name: error.name,
            }
          : "Unknown error occurred",
      timestamp: new Date().toISOString(),
      date: targetDate,
    };
    const apiEnd = Date.now();
    console.log(
      "[API PERF] /api/stats total duration (error):",
      apiEnd - apiStart,
      "ms"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
