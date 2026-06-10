// Test fixtures for the pitcher-streaming dashboard components — shaped
// exactly like GET /api/streaming-picks/comparison responses.

import { ComparisonReport } from "@/src/application/services/StreamingComparisonService";

export function makeReport(
  overrides: Partial<ComparisonReport> = {}
): ComparisonReport {
  return {
    startDate: "2026-03-25",
    endDate: "2026-06-09",
    resources: [
      {
        resource: "fantasypros",
        coverage: { successDays: 0, failedDays: 0 },
        overall: { picks: 0, scored: 0, unmatched: 0, pending: 0, avgPoints: null },
        byBucket: [],
        byTier: [],
      },
      {
        resource: "pitcherlist",
        coverage: { successDays: 1, failedDays: 0 },
        overall: { picks: 2167, scored: 1966, unmatched: 201, pending: 0, avgPoints: 16.7 },
        byBucket: [
          { bucket: "high", picks: 729, scored: 704, avgPoints: 21.3 },
          { bucket: "mid", picks: 731, scored: 672, avgPoints: 15.5 },
          { bucket: "low", picks: 707, scored: 590, avgPoints: 12.5 },
        ],
        byTier: [
          { tier: "Auto-Starts", picks: 442, scored: 431, avgPoints: 23.6 },
          { tier: "Probably Starts", picks: 423, scored: 405, avgPoints: 18.1 },
          { tier: "Questionable Starts", picks: 511, scored: 473, avgPoints: 15.1 },
          { tier: "Do Not Starts", picks: 789, scored: 655, avgPoints: 12.3 },
        ],
      },
      {
        resource: "dailywaivers",
        coverage: { successDays: 1, failedDays: 2 },
        overall: { picks: 2060, scored: 2039, unmatched: 21, pending: 0, avgPoints: 16.1 },
        byBucket: [
          { bucket: "high", picks: 710, scored: 705, avgPoints: 21.2 },
          { bucket: "mid", picks: 690, scored: 676, avgPoints: 15.5 },
          { bucket: "low", picks: 660, scored: 658, avgPoints: 11.3 },
        ],
        byTier: [],
      },
    ],
    ...overrides,
  };
}
