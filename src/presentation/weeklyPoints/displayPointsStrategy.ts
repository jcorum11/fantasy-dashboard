import { PlayerWeekly } from "./types";

export type DisplayPointsStrategy = (
  weeklyPoints: PlayerWeekly["weeklyPoints"],
  lastCompleteWeekIdx: number
) => number;

/**
 * Default strategy: start at lastCompleteWeekIdx and walk backward until
 * encountering a non-zero week.
 */
export const defaultDisplayPointsStrategy: DisplayPointsStrategy = (
  weeklyPoints,
  lastCompleteWeekIdx
) => {
  for (let i = lastCompleteWeekIdx; i >= 0; i--) {
    const pts = weeklyPoints[i] ?? 0;
    if (pts !== 0) return pts;
  }
  return 0;
}; 