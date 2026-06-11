/**
 * Creates (or migrates) every table the app uses. Idempotent — safe to re-run.
 *
 *   pnpm run migrate
 *   (equivalent to: pnpm exec tsx --env-file=.env.local scripts/migrate-db.ts)
 */
import { Container } from "../src/infrastructure/config/container";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (copy .env.example to .env.local)");
  }
  const container = Container.getInstance();
  container.initialize(process.env.DATABASE_URL);

  console.log("Creating player_stats…");
  await container.getPlayerStatsService().initializeDatabase();

  console.log("Creating streaming_picks + ingest_runs…");
  await container.getStreamingPickRepository().createTables();

  console.log("Migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
