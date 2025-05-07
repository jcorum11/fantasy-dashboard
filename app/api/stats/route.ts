import { NextRequest, NextResponse } from "next/server";
import { Container } from "../../../src/infrastructure/config/container";

// Initialize container
const container = Container.getInstance();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
container.initialize(process.env.DATABASE_URL);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const service = container.getPlayerStatsService();
    const stats = await service.getPlayerStatsByDate(date);

    return NextResponse.json({
      stats,
      date,
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch player stats" },
      { status: 500 }
    );
  }
}
