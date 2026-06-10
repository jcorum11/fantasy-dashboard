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

    // Default to yesterday — the latest complete (scored) game date
    const fallback = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const dateParam = searchParams.get("date") ?? fallback;
    const gameDate = new Date(`${dateParam}T00:00:00Z`);
    if (isNaN(gameDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date (expected YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const goodStart = Number(searchParams.get("goodStart") ?? 15);
    const bomb = Number(searchParams.get("bomb") ?? 5);
    if (isNaN(goodStart) || isNaN(bomb) || goodStart <= bomb) {
      return NextResponse.json(
        { error: "goodStart and bomb must be numbers with goodStart > bomb" },
        { status: 400 }
      );
    }

    const breakdown = await container
      .getDailyBreakdownService()
      .breakdown(gameDate, { goodStart, bomb });

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Error building daily breakdown:", error);
    return NextResponse.json(
      { error: "Failed to build daily breakdown" },
      { status: 500 }
    );
  }
}
