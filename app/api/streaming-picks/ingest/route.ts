import { NextRequest, NextResponse } from "next/server";
import { Container } from "../../../../src/infrastructure/config/container";

// Initialize container
const container = Container.getInstance();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
container.initialize(process.env.DATABASE_URL);

// Never prerender at build time — this route ingests from live sources and
// writes to the database when invoked.
export const dynamic = "force-dynamic";

// Vercel cron invokes paths with GET. When CRON_SECRET is set, Vercel sends
// it as a Bearer token and manual calls must supply it too.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    cronSecret &&
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await container.getStreamingPickRepository().createTables();

    const today = new Date().toISOString().split("T")[0];
    const pickDate = new Date(`${today}T00:00:00Z`);

    const summary = await container
      .getStreamingPickIngestService()
      .ingest(pickDate);

    // Yesterday's games are final by the time the cron fires (17:00 UTC) —
    // score those picks against actual results in the same run.
    const yesterday = new Date(pickDate.getTime() - 24 * 60 * 60 * 1000);
    let scoring = null;
    try {
      scoring = await container
        .getStreamingPickScoringService()
        .scoreGameDate(yesterday);
    } catch (error: any) {
      console.error("Error scoring yesterday's picks:", error);
      scoring = { error: error?.message || "Unknown error" };
    }

    // Persist yesterday's player box-score stats — the breakout-hitters
    // page reads daily points from player_stats, so this keeps the season
    // series current. Best-effort, same as scoring.
    let playerStats = null;
    try {
      playerStats = await container
        .getPlayerStatsService()
        .persistStatsForDate(yesterday);
    } catch (error: any) {
      console.error("Error persisting yesterday's player stats:", error);
      playerStats = { error: error?.message || "Unknown error" };
    }

    // Partial failure is a report, not an error — the surviving resources'
    // picks are persisted and the failures are visible per-resource.
    const allFailed = summary.results.every((r) => r.status === "failure");
    return NextResponse.json(
      { pickDate: today, ...summary, scoring, playerStats },
      { status: allFailed ? 500 : 200 }
    );
  } catch (error: any) {
    console.error("Error ingesting streaming picks:", error);
    return NextResponse.json(
      { error: "Failed to ingest streaming picks" },
      { status: 500 }
    );
  }
}
