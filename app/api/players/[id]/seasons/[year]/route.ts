import { NextResponse } from "next/server";
import { Container } from "@/src/infrastructure/config/container";
import {
  badRequest,
  parsePositiveInt,
  parseSeason,
  serverError,
} from "@/src/presentation/api/params";

/** GET /api/players/:id/seasons/:year — Monday–Sunday weekly points for one regular season. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string; year: string } }
) {
  const playerId = parsePositiveInt(params.id);
  if (playerId === null) return badRequest("id must be a positive integer");
  const season = parseSeason(params.year);
  if (season === null) return badRequest("year must be a four-digit season");

  try {
    const result = await Container.getInstance()
      .getPlayerPointsService()
      .getSeasonWeeklyPoints(playerId, season);
    return NextResponse.json(result);
  } catch (error) {
    return serverError(error);
  }
}
