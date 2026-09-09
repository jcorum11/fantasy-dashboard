/**
 * Monday–Sunday fantasy weeks. Week 1 begins on the Monday on or before the
 * regular season's opening day; the last week ends on the Sunday on or after
 * its final day. All dates are YYYY-MM-DD strings handled as UTC calendar
 * days, so no local-timezone drift.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeekSpan {
  week: number;
  start: string;
  end: string;
}

export function parseDay(day: string): number {
  const ms = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`Invalid date: ${day}`);
  return ms;
}

export function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Monday on or before the given day. */
export function mondayOnOrBefore(day: string): string {
  const ms = parseDay(day);
  const dow = new Date(ms).getUTCDay(); // 0 = Sunday
  const back = (dow + 6) % 7; // Monday -> 0, Sunday -> 6
  return formatDay(ms - back * DAY_MS);
}

/** Every fantasy week that overlaps [seasonStart, seasonEnd]. */
export function seasonWeeks(seasonStart: string, seasonEnd: string): WeekSpan[] {
  const first = parseDay(mondayOnOrBefore(seasonStart));
  const last = parseDay(seasonEnd);
  if (last < first) throw new Error("Season end precedes season start");

  const weeks: WeekSpan[] = [];
  for (let start = first, week = 1; start <= last; start += 7 * DAY_MS, week++) {
    weeks.push({
      week,
      start: formatDay(start),
      end: formatDay(start + 6 * DAY_MS),
    });
  }
  return weeks;
}

/**
 * 0-based index into `seasonWeeks(...)` for a game day, or -1 if the day falls
 * outside the season's weeks.
 */
export function weekIndexFor(day: string, weeks: WeekSpan[]): number {
  if (weeks.length === 0) return -1;
  const offset = parseDay(day) - parseDay(weeks[0].start);
  if (offset < 0) return -1;
  const index = Math.floor(offset / (7 * DAY_MS));
  return index < weeks.length ? index : -1;
}
