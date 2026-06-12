/**
 * One-shot 2026-season backfill of daily player box-score stats into
 * player_stats (idempotent — safe to re-run for catch-up after cron
 * outages). The breakout-hitters page computes rolling 7-day points from
 * this table, so every season date needs a row set.
 *
 *   pnpm exec tsx --env-file=.env scripts/backfill-player-stats.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-player-stats.ts
 *
 * - Default run fills only dates with no rows; --force re-persists every
 *   date (delete+insert per date, so no duplicates either way).
 * - Dates with zero stats (off days) are reported and naturally retried on
 *   the next run — persisting nothing is cheap.
 * - Going forward the daily /api/streaming-picks/ingest cron persists
 *   yesterday's stats, so this script is only needed for catch-up.
 */
import { Container } from "../src/infrastructure/config/container";

const SEASON_START = "2026-03-15";
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const container = Container.getInstance();
  container.initialize(process.env.DATABASE_URL);
  const service = container.getPlayerStatsService();

  const start = Date.parse(`${SEASON_START}T00:00:00Z`);
  const yesterday = Date.now() - DAY_MS;

  const covered = new Set(
    FORCE
      ? []
      : await container
          .getPlayerStatsRepository()
          .getDatesWithData(new Date(start), new Date(yesterday))
  );

  const targets: string[] = [];
  for (let t = start; t <= yesterday; t += DAY_MS) {
    const day = isoDay(t);
    if (!covered.has(day)) targets.push(day);
  }

  console.log(
    `${targets.length} date(s) to persist (${covered.size} already covered)` +
      (DRY_RUN ? " [dry run]" : "")
  );
  if (DRY_RUN || targets.length === 0) return;

  let rows = 0;
  const empty: string[] = [];
  for (const day of targets) {
    const summary = await service.persistStatsForDate(day);
    rows += summary.persisted;
    if (summary.persisted === 0) empty.push(day);
    console.log(`${day}: ${summary.persisted} rows`);
  }

  console.log(`done — ${rows} rows across ${targets.length} date(s)`);
  if (empty.length > 0) {
    console.log(`no stats found for: ${empty.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
