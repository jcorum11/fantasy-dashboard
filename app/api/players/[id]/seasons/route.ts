import { NextResponse } from "next/server";
import { Container } from "@/src/infrastructure/config/container";
import { badRequest, parsePositiveInt, serverError } from "@/src/presentation/api/params";

/** GET /api/players/:id/seasons — seasons the player has regular-season stats in, ascending. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parsePositiveInt(params.id);
  if (playerId === null) return badRequest("id must be a positive integer");

  try {
    const seasons = await Container.getInstance()
      .getPlayerPointsService()
      .getSeasonsPlayed(playerId);
    return NextResponse.json({ playerId, seasons });
  } catch (error) {
    return serverError(error);
  }
}
