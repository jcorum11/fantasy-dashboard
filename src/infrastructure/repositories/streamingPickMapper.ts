import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { StreamingResource } from "@/src/domain/models/StreamingResource";

export interface StreamingPickRow {
  resource: string;
  pitcher_name: string;
  game_date: string;
  pick_date: string;
  mlb_player_id: number | null;
  team: string | null;
  opponent: string | null;
  is_home: boolean | null;
  rank: number | null;
  tier: string | null;
  raw_score: number | string | null;
}

// DATE columns come back as "YYYY-MM-DD"; anchor to UTC midnight so the
// calendar day survives local-timezone conversion.
function parseDateColumn(value: string): Date {
  return new Date(`${value.split("T")[0]}T00:00:00Z`);
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
  });
}
