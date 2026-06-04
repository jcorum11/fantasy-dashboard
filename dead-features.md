# Dead Features

Features removed from the codebase but preserved in git history. To bring one
back, check out the referenced file(s) from the listed commit.

---

## ESPN fantasy roster integration

- **What it did:** Fetched the set of rostered player names from an ESPN fantasy
  league (authenticated via `SWID` / `espn_s2` cookies) to drive the waiver-wire
  indicator (green = on the waiver wire, black = rostered).
- **Why removed:** Superseded by the Yahoo integration
  (`lib/yahoo/YahooFantasyService.ts`) — Yahoo is the only active league, so the
  roster source is now always Yahoo.
- **Removed:** 2026-06-04
- **Last present at commit:** `617342f`
- **File(s):** `lib/espn/ESPNFantasyService.ts`
- **Restore:** `git checkout 617342f -- lib/espn/ESPNFantasyService.ts`
- **Also unused now:** env vars `SWID`, `ESPN_S2`, `ESPN_LEAGUE_ID`,
  `ESPN_SEASON`, `ESPN_SEGMENT` (no longer read by the app).
