// Test fixtures/mocks for StreamingPickIngestService.

import { vi } from "vitest";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { StreamingResource } from "@/src/domain/models/StreamingResource";

export function makePick(
  resource: StreamingResource,
  pitcherName: string,
  rank: number
): StreamingPick {
  return StreamingPick.create({
    resource,
    pitcherName,
    gameDate: new Date("2026-06-10T00:00:00Z"),
    pickDate: new Date("2026-06-10T00:00:00Z"),
    rank,
  });
}

export function makeClients(overrides: {
  fantasypros?: () => Promise<StreamingPick[]>;
  pitcherlist?: () => Promise<StreamingPick[]>;
  dailywaivers?: () => Promise<StreamingPick[]>;
}) {
  return {
    fantasypros: {
      fetchPicks: vi.fn(
        overrides.fantasypros ??
          (() => Promise.resolve([makePick("fantasypros", "Shohei Ohtani", 1)]))
      ),
    },
    pitcherlist: {
      fetchPicks: vi.fn(
        overrides.pitcherlist ??
          (() => Promise.resolve([makePick("pitcherlist", "Chris Sale", 1)]))
      ),
    },
    dailywaivers: {
      fetchPicks: vi.fn(
        overrides.dailywaivers ??
          (() =>
            Promise.resolve([
              makePick("dailywaivers", "Chris Sale", 1),
              makePick("dailywaivers", "Mitch Keller", 2),
            ]))
      ),
    },
  };
}

export function makeRepository() {
  return {
    createTables: vi.fn().mockResolvedValue(undefined),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    findByGameDateRange: vi.fn().mockResolvedValue([]),
    recordIngestRun: vi.fn().mockResolvedValue(undefined),
    findIngestRuns: vi.fn().mockResolvedValue([]),
  };
}
