import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { StreamingResource } from "@/src/domain/models/StreamingResource";

export interface StreamingPickRow {
  resource: string;
  pitcher_name: string;
  game_date: string | Date;
  pick_date: string | Date;
  mlb_player_id: number | null;
  team: string | null;
  opponent: string | null;
  is_home: boolean | null;
  rank: number | null;
  tier: string | null;
  raw_score: number | string | null;
  appearance?: number;
  actual_points?: number | null;
  scored_at?: string | Date | null;
}

// DATE columns come back as "YYYY-MM-DD" strings or JS Date objects
// depending on the driver; anchor to UTC midnight either way so the
// calendar day survives local-timezone conversion.
export function parseDateColumn(value: string | Date): Date {
  // pg-style drivers parse DATE at LOCAL midnight — read local Y/M/D back.
  const iso =
    value instanceof Date
      ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
      : value.split("T")[0];
  return new Date(`${iso}T00:00:00Z`);
}

export function rowToStreamingPick(row: StreamingPickRow): StreamingPick {
  return StreamingPick.create({
    resource: row.resource as StreamingResource,
    pitcherName: row.pitcher_name,
    gameDate: parseDateColumn(row.game_date),
    pickDate: parseDateColumn(row.pick_date),
    mlbPlayerId: row.mlb_player_id,
    team: row.team,
    opponent: row.opponent,
    isHome: row.is_home,
    rank: row.rank,
    tier: row.tier,
    rawScore: row.raw_score === null ? null : Number(row.raw_score),
    appearance: row.appearance ?? 1,
    actualPoints: row.actual_points ?? null,
    scoredAt: row.scored_at == null ? null : new Date(row.scored_at),
  });
}
