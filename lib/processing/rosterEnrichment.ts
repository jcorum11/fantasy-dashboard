/** Lowercase + strip diacritics, so names match across accent/case differences. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Mark players as rostered when their (normalized) full name appears in the
 * rostered-name set. Matching is accent/case-insensitive on both sides.
 * Mutates `players` in place and returns it. An empty set leaves everyone
 * unrostered — the graceful default when roster data is unavailable.
 */
export function enrichWithRoster<
  T extends { fullName: string; isRostered: boolean }
>(players: T[], rosteredNames: Iterable<string>): T[] {
  const normalized = new Set<string>();
  for (const name of rosteredNames) normalized.add(normalizeName(name));

  for (const player of players) {
    if (normalized.has(normalizeName(player.fullName))) {
      player.isRostered = true;
    }
  }
  return players;
}
