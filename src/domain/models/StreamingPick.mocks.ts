import { StreamingPickProps } from "@/src/domain/models/StreamingPick";

export function buildPickProps(
  overrides: Partial<StreamingPickProps> = {}
): StreamingPickProps {
  return {
    resource: "dailywaivers",
    pitcherName: "Mitch Keller",
    gameDate: new Date("2026-06-10T00:00:00Z"),
    pickDate: new Date("2026-06-09T00:00:00Z"),
    mlbPlayerId: 656605,
    team: "PIT",
    opponent: "MIA",
    isHome: true,
    rank: 4,
    tier: null,
    rawScore: 78.5,
    ...overrides,
  };
}
