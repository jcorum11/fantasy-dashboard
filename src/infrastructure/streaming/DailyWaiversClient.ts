import { StreamingPick } from "@/src/domain/models/StreamingPick";

const API_BASE = "https://dailywaivers.com/api";

export interface DailyWaiversRecord {
  id: string;
  game_date: string;
  game_time?: string;
  is_home: boolean | null;
  dwScore?: number | null;
  player: {
    id: string;
    name: string;
    throws?: string;
    yahooid?: number | null;
  };
  team: {
    id: string;
    short_name: string;
    full_name: string;
    abb: string;
  } | null;
  opponent: {
    id: string;
    short_name: string;
    full_name: string;
    abb: string;
  } | null;
}

function toDateParam(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDailyWaiversRecords(
  records: DailyWaiversRecord[],
  pickDate: Date
): StreamingPick[] {
  if (
    records.length > 0 &&
    records.every((r) => r.dwScore === null || r.dwScore === undefined)
  ) {
    throw new Error(
      "DailyWaivers returned no dwScore on any record — schema drift?"
    );
  }

  // Rank per game_date: dwScore DESC, scoreless records last, ties by name
  // ASC so re-ingest upserts are idempotent.
  const byGameDate = new Map<string, DailyWaiversRecord[]>();
  for (const record of records) {
    const day = byGameDate.get(record.game_date) ?? [];
    day.push(record);
    byGameDate.set(record.game_date, day);
  }

  const picks: StreamingPick[] = [];
  for (const [gameDate, day] of byGameDate) {
    const seen = new Set<string>();
    for (const record of day) {
      if (seen.has(record.player.name)) {
        throw new Error(
          `DailyWaivers lists ${record.player.name} twice on ${gameDate} — doubleheader?`
        );
      }
      seen.add(record.player.name);
    }

    day.sort((a, b) => {
      const scoreA = a.dwScore ?? -Infinity;
      const scoreB = b.dwScore ?? -Infinity;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.player.name.localeCompare(b.player.name);
    });

    day.forEach((record, index) => {
      picks.push(
        StreamingPick.create({
          resource: "dailywaivers",
          pitcherName: record.player.name,
          gameDate: new Date(`${gameDate}T00:00:00Z`),
          pickDate,
          team: record.team?.abb ?? null,
          opponent: record.opponent?.abb ?? null,
          isHome: record.is_home,
          rank: index + 1,
          rawScore: record.dwScore ?? null,
        })
      );
    });
  }

  return picks;
}

export class DailyWaiversClient {
  public async fetchPicks(
    startDate: Date,
    endDate: Date,
    pickDate: Date
  ): Promise<StreamingPick[]> {
    const url =
      `${API_BASE}/players/probables` +
      `?startDate=${toDateParam(startDate)}` +
      `&endDate=${toDateParam(endDate)}` +
      `&showRanks=true`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`DailyWaivers request failed: ${res.status}`);
    }

    const records: DailyWaiversRecord[] = await res.json();
    return parseDailyWaiversRecords(records, pickDate);
  }
}
