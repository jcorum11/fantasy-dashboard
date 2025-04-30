import { format, subDays, addDays } from "date-fns";

/**
 * Get the MLB timezone date (America/New_York)
 */
export function getMLBDate(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

/**
 * Get yesterday's date in MLB timezone
 */
export function getYesterdayMLB(): string {
  const nyDate = getMLBDate();
  return format(nyDate, "yyyy-MM-dd");
}

/**
 * Validate if a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string): boolean {
  if (!isValidDateFormat(date)) return true;

  const [year, month, day] = date.split("-").map(Number);
  const requestedDate = new Date(year, month - 1, day);
  const today = getMLBDate();

  return requestedDate > today;
}

/**
 * Get a user-friendly message about game availability for a given date
 */
export function getGameAvailabilityMessage(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const today = getMLBDate();
  const currentSeason = today.getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const formattedDate = `${monthNames[month - 1]} ${day}, ${year}`;

  // Future season
  if (year > currentSeason) {
    return `Schedule for the ${year} MLB season is not yet available. Please check back later.`;
  }

  // Past season
  if (year < currentSeason) {
    return `No games were played on ${formattedDate} (past season).`;
  }

  if (isFutureDate(date)) {
    return `No games are scheduled for ${formattedDate} yet.`;
  }

  return `No games were played on ${formattedDate}.`;
}

/**
 * Check if a date is navigable (not in the future)
 */
export function canNavigateToDate(date: string): boolean {
  if (!isValidDateFormat(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const today = getMLBDate();
  const currentSeason = today.getFullYear();

  // Can't navigate to future seasons
  if (year > currentSeason) {
    return false;
  }

  // Can always navigate to past seasons
  if (year < currentSeason) {
    return true;
  }

  // For current season
  const yesterday = getYesterdayMLB();
  return date <= yesterday;
}

/**
 * Get the next valid date for navigation
 */
export function getNextValidDate(currentDate: string): string | null {
  if (!isValidDateFormat(currentDate)) {
    return null;
  }

  const nextDate = addDays(new Date(currentDate + "T00:00:00Z"), 1);
  const nextDateStr = format(nextDate, "yyyy-MM-dd");

  if (!canNavigateToDate(nextDateStr)) {
    return null;
  }

  return nextDateStr;
}

/**
 * Get the previous valid date for navigation
 */
export function getPreviousValidDate(currentDate: string): string {
  if (!isValidDateFormat(currentDate)) {
    return getYesterdayMLB();
  }

  const [year, month, day] = currentDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const prevDate = subDays(date, 1);
  return format(prevDate, "yyyy-MM-dd");
}
