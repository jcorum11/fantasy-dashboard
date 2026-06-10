// Test fixtures for DailyBreakdownTable — shaped exactly like
// GET /api/streaming-picks/daily responses.

import { DailyBreakdown } from "@/src/application/services/DailyBreakdownService";

export function makeBreakdown(
  overrides: Partial<DailyBreakdown> = {}
): DailyBreakdown {
  return {
    gameDate: "2026-06-09",
    pitchers: [
      {
        pitcherName: "Chris Sale",
        team: "ATL",
        opponent: "CHW",
        isHome: false,
        actualPoints: 27.9,
        status: "scored",
        calls: {
          dailywaivers: { rank: 1, tier: null, bucket: "high", verdict: "win" },
          pitcherlist: {
            rank: 2,
            tier: "Auto-Starts",
            bucket: "high",
            verdict: "win",
          },
        },
      },
      {
        pitcherName: "Bad Call",
        team: "COL",
        opponent: "LAD",
        isHome: true,
        actualPoints: 1.2,
        status: "scored",
        calls: {
          dailywaivers: { rank: 2, tier: null, bucket: "high", verdict: "loss" },
          pitcherlist: {
            rank: 18,
            tier: "Do Not Starts",
            bucket: "low",
            verdict: "win", // correct avoid-call under pure bucketing
          },
        },
      },
      {
        pitcherName: "Scratched Guy",
        team: "MIA",
        opponent: "NYM",
        isHome: false,
        actualPoints: null,
        status: "no-show",
        calls: {
          dailywaivers: { rank: 9, tier: null, bucket: "mid", verdict: null },
        },
      },
    ],
    record: {
      fantasypros: { wins: 0, losses: 0 },
      pitcherlist: { wins: 2, losses: 0 },
      dailywaivers: { wins: 1, losses: 1 },
    },
    ...overrides,
  };
}
