import { NextRequest, NextResponse } from "next/server";
import { Container } from "@/src/infrastructure/config/container";
import { badRequest, parseSeason, serverError } from "@/src/presentation/api/params";

/**
 * GET /api/players[?season=YYYY]
 * Every player with a regular-season appearance, sorted by Yahoo points.
 * Defaults to the current season (last season before opening day).
 */
export async function GET(request: NextRequest) {
  const service = Container.getInstance().getPlayerPointsService();
  const raw = request.nextUrl.searchParams.get("season");
  if (raw !== null && parseSeason(raw) === null) {
    return badRequest("season must be a four-digit year");
  }

  try {
    const season = raw ? Number(raw) : await service.resolveCurrentSeason();
    const players = await service.listPlayers(season);
    return NextResponse.json({ season, players });
  } catch (error) {
    return serverError(error);
  }
}
