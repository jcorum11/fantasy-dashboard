import { NextRequest, NextResponse } from "next/server";
import { Container } from "../../../../src/infrastructure/config/container";

// Initialize container
const container = Container.getInstance();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
container.initialize(process.env.DATABASE_URL);

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

    // Partial failure is a report, not an error — the surviving resources'
    // picks are persisted and the failures are visible per-resource.
    const allFailed = summary.results.every((r) => r.status === "failure");
    return NextResponse.json(
      { pickDate: today, ...summary },
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
