/**
 * One-shot 2026-season backfill for streaming picks (idempotent — safe to
 * re-run for catch-up after cron outages).
 *
 *   pnpm exec tsx --env-file=.env.local scripts/backfill-streaming-picks.ts --dry-run
 *   pnpm exec tsx --env-file=.env.local scripts/backfill-streaming-picks.ts
 *
 * - Pitcher List: every SP-streamer article since season start via the WP
 *   REST API, processed oldest-first so the article closest to each game
 *   date wins the upsert (articles cover rolling 3-day windows).
 * - DailyWaivers: one API call per day. CAVEAT: their API serves CURRENT
 *   dwScores for past dates — possibly recomputed, not exactly what was
 *   displayed that day. pickDate = gameDate for backfilled DW picks.
 * - FantasyPros: no archive exists — skipped; data accumulates from the
 *   daily cron only.
 * - Scoring catch-up (real run only): scores every unscored game date
 *   before today via the MLB boxscore pipeline.
 *
 * Backfill does NOT write ingest_runs — those track daily cron health.
 */
import { Container } from "../src/infrastructure/config/container";
import { DailyWaiversClient } from "../src/infrastructure/streaming/DailyWaiversClient";
import { parsePitcherListArticle } from "../src/infrastructure/streaming/PitcherListClient";
import { StreamingPick } from "../src/domain/models/StreamingPick";

const SEASON_START = "2026-03-15";
const DRY_RUN = process.argv.includes("--dry-run");
const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value: string | Date): Date {
  const s = value instanceof Date ? value.toISOString() : value;
  return new Date(`${s.split("T")[0]}T00:00:00Z`);
}

function fmt(date: Date): string {
  return date.toISOString().split("T")[0];
}

function summarize(label: string, picks: StreamingPick[]) {
  const byDate = new Map<string, number>();
  for (const p of picks) {
    byDate.set(fmt(p.gameDate), (byDate.get(fmt(p.gameDate)) ?? 0) + 1);
  }
  const dates = [...byDate.keys()].sort();
  console.log(
    `\n[${label}] ${picks.length} picks across ${dates.length} game dates` +
      (dates.length
        ? ` (${dates[0]} … ${dates[dates.length - 1]})`
        : "")
  );
  const counts = [...byDate.values()];
  if (counts.length) {
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
    console.log(`[${label}] picks/date: min ${min}, avg ${avg}, max ${max}`);
  }
  const sample = picks[0];
  if (sample) console.log(`[${label}] sample:`, JSON.stringify(sample.toJSON()));
}

async function backfillPitcherList(): Promise<StreamingPick[]> {
  const all: StreamingPick[] = [];
  let failures = 0;

  for (let page = 1; ; page++) {
    const url =
      `https://pitcherlist.com/wp-json/wp/v2/posts?categories=233` +
      `&per_page=100&page=${page}&order=asc&orderby=date` +
      `&after=${SEASON_START}T00:00:00`;
    const res = await fetch(url);
    if (!res.ok) {
      // WP returns 400 for a page past the last one
      if (res.status === 400 && page > 1) break;
      throw new Error(`Pitcher List backfill failed: ${res.status}`);
    }
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) break;

    for (const post of posts) {
      try {
        const picks = parsePitcherListArticle(
          post.content.rendered,
          utcDay(post.date)
        );
        all.push(...picks);
      } catch (error: any) {
        failures++;
        console.warn(`  ! ${post.slug}: ${error?.message}`);
      }
    }
    console.log(`[pitcherlist] page ${page}: ${posts.length} articles`);
    if (posts.length < 100) break;
  }

  if (failures) console.warn(`[pitcherlist] ${failures} articles failed to parse`);
  // Oldest-first processing means dedupe keeps the LATEST article's view of
  // each (game_date, pitcher) — same winner as the DB upsert.
  const deduped = new Map<string, StreamingPick>();
  for (const pick of all) {
    deduped.set(
      `${fmt(pick.gameDate)}|${pick.pitcherName}|${pick.appearance}`,
      pick
    );
  }
  return [...deduped.values()];
}

async function backfillDailyWaivers(endDate: Date): Promise<StreamingPick[]> {
  const client = new DailyWaiversClient();
  const all: StreamingPick[] = [];

  for (
    let day = utcDay(SEASON_START);
    day.getTime() <= endDate.getTime();
    day = new Date(day.getTime() + DAY_MS)
  ) {
    try {
      // pickDate = gameDate: we can't know what DW displayed historically
      const picks = await client.fetchPicks(day, day, day);
      all.push(...picks);
      process.stdout.write(`\r[dailywaivers] ${fmt(day)}: ${all.length} picks total   `);
    } catch (error: any) {
      console.warn(`\n[dailywaivers] ${fmt(day)} failed: ${error?.message}`);
    }
  }
  console.log();
  return all;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (use --env-file=.env.local)");
  }
  const container = Container.getInstance();
  container.initialize(process.env.DATABASE_URL);
  const repository = container.getStreamingPickRepository();

  const today = utcDay(new Date());
  const yesterday = new Date(today.getTime() - DAY_MS);
  console.log(
    `Backfill ${SEASON_START} … ${fmt(yesterday)}${DRY_RUN ? " (DRY RUN — no writes)" : ""}`
  );
  console.log("[fantasypros] skipped — no archive exists, cron-only");

  const plPicks = await backfillPitcherList();
  summarize("pitcherlist", plPicks);

  const dwPicks = await backfillDailyWaivers(yesterday);
  summarize("dailywaivers", dwPicks);

  if (DRY_RUN) {
    console.log("\nDry run complete — nothing written.");
    return;
  }

  await repository.createTables();
  await repository.saveBatch(plPicks);
  await repository.saveBatch(dwPicks);
  console.log(`\nSaved ${plPicks.length + dwPicks.length} picks.`);

  const scoring = container.getStreamingPickScoringService();
  const dates = await repository.findUnscoredGameDates(today);
  console.log(`Scoring ${dates.length} unscored game dates…`);
  for (const date of dates) {
    const summary = await scoring.scoreGameDate(date);
    console.log(
      `  ${summary.gameDate}: scored ${summary.scored}` +
        (summary.unmatched.length
          ? `, no-show ${summary.unmatched.length} (${summary.unmatched.slice(0, 3).join(", ")}${summary.unmatched.length > 3 ? "…" : ""})`
          : "")
    );
  }
  console.log("Backfill complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
