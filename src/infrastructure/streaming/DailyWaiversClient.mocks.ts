// Test fixtures/mocks for DailyWaiversClient.

import { DailyWaiversRecord } from "@/src/infrastructure/streaming/DailyWaiversClient";

// A trimmed copy of a real /api/players/probables record (2026-06-10).
// Only the fields the parser reads are kept, but the nesting is faithful.
export function makeRecord(
  overrides: Partial<DailyWaiversRecord> & {
    name?: string;
    teamAbb?: string;
    opponentAbb?: string;
  } = {}
): DailyWaiversRecord {
  const { name, teamAbb, opponentAbb, ...rest } = overrides;
  return {
    id: "4herexvz9jw2zj3",
    game_date: "2026-06-10",
    game_time: "2026-06-10T20:10:00Z",
    is_home: true,
    dwScore: 60,
    player: {
      id: "039anvhf426f6hv",
      name: name ?? "Michael King",
      throws: "R",
      yahooid: 11661,
    },
    team: {
      id: "h365ew4vq917ayx",
      short_name: "Padres",
      full_name: "San Diego Padres",
      abb: teamAbb ?? "SDP",
    },
    opponent: {
      id: "911hsa43337k967",
      short_name: "Reds",
      full_name: "Cincinnati Reds",
      abb: opponentAbb ?? "CIN",
    },
    ...rest,
  };
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(status: number): Response {
  return new Response("nope", { status });
}
