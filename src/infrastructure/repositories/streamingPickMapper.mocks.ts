import { StreamingPickRow } from "@/src/infrastructure/repositories/streamingPickMapper";

export function buildPickRow(
  overrides: Partial<StreamingPickRow> = {}
): StreamingPickRow {
  return {
    resource: "fantasypros",
    pitcher_name: "Shohei Ohtani",
    game_date: "2026-06-10",
    pick_date: "2026-06-10",
    mlb_player_id: 660271,
    team: "LAD",
    opponent: "PIT",
    is_home: false,
    rank: 1,
    tier: null,
    raw_score: null,
    ...overrides,
  };
}
