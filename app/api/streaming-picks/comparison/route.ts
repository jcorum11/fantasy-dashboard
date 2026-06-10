import { NextRequest, NextResponse } from "next/server";
import { Container } from "../../../../src/infrastructure/config/container";

// Initialize container
const container = Container.getInstance();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
container.initialize(process.env.DATABASE_URL);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const today = new Date().toISOString().split("T")[0];
    const seasonStart = `${today.split("-")[0]}-03-01`;

    const startDate = new Date(
      `${searchParams.get("startDate") ?? seasonStart}T00:00:00Z`
    );
    const endDate = new Date(
      `${searchParams.get("endDate") ?? today}T00:00:00Z`
    );

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid startDate or endDate (expected YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const report = await container
      .getStreamingComparisonService()
      .compare(startDate, endDate);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error building streaming comparison:", error);
    return NextResponse.json(
      { error: "Failed to build streaming comparison" },
      { status: 500 }
    );
  }
}
