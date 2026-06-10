// Test fixtures/mocks for DailyBreakdownService.

import { vi } from "vitest";
import { StreamingPick, StreamingPickProps } from "@/src/domain/models/StreamingPick";

export const GAME_DATE = new Date("2026-06-10T00:00:00Z");
const SCORED_AT = new Date("2026-06-11T17:00:00Z");

/**
 * Pick builder: actualPoints defaults to a scored 10-point start; pass
 * null for "scored, didn't pitch" or pending: true for not-yet-scored.
 */
export function pick(
  props: Partial<StreamingPickProps> & {
    pitcherName: string;
    pending?: boolean;
  }
): StreamingPick {
  const { pending, ...overrides } = props;
  return StreamingPick.create({
    resource: "dailywaivers",
    gameDate: GAME_DATE,
    pickDate: GAME_DATE,
    rank: 1,
    actualPoints: pending ? null : 10,
    scoredAt: pending ? null : SCORED_AT,
    ...overrides,
  });
}

export function makeRepository(picks: StreamingPick[]) {
  return {
    findByGameDateRange: vi.fn().mockResolvedValue(picks),
  };
}
