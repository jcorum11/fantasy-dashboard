// Test fixtures/mocks for StreamingComparisonService.

import { vi } from "vitest";
import { IngestRun } from "@/src/domain/models/IngestRun";
import { StreamingPick, StreamingPickProps } from "@/src/domain/models/StreamingPick";

const SCORED_AT = new Date("2026-06-11T17:00:00Z");

/**
 * Scored-pick builder: pass actualPoints for a pitched result, null for
 * "scored, didn't pitch" (unmatched), and omit scoredAt-style fields via
 * pending: true for not-yet-scored picks.
 */
export function scoredPick(
  props: Partial<StreamingPickProps> & {
    pitcherName: string;
    pending?: boolean;
  }
): StreamingPick {
  const { pending, ...overrides } = props;
  return StreamingPick.create({
    resource: "dailywaivers",
    gameDate: new Date("2026-06-10T00:00:00Z"),
    pickDate: new Date("2026-06-10T00:00:00Z"),
    rank: 1,
    actualPoints: pending ? null : 10,
    scoredAt: pending ? null : SCORED_AT,
    ...overrides,
  });
}

export function makeRun(overrides: Partial<IngestRun> = {}): IngestRun {
  return {
    resource: "dailywaivers",
    runDate: new Date("2026-06-10T00:00:00Z"),
    status: "success",
    picksCount: 30,
    error: null,
    ...overrides,
  };
}

export function makeRepository(
  picks: StreamingPick[],
  runs: IngestRun[] = []
) {
  return {
    createTables: vi.fn().mockResolvedValue(undefined),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    findByGameDateRange: vi.fn().mockResolvedValue(picks),
    recordIngestRun: vi.fn().mockResolvedValue(undefined),
    findIngestRuns: vi.fn().mockResolvedValue(runs),
    updateActualPoints: vi.fn().mockResolvedValue(undefined),
  };
}
