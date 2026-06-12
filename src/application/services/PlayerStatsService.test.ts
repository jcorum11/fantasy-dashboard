import { describe, expect, it, vi } from "vitest";
import { PlayerStatsService } from "@/src/application/services/PlayerStatsService";
import {
  GAME_DATE,
  makeMLBClient,
  makePlayerStats,
  makeRepository,
} from "@/src/application/services/PlayerStatsService.mocks";

// Assumed contract (drives the implementation):
//   new PlayerStatsService(mlbClient, databaseUrl?, repository?)
//     .persistStatsForDate(date) -> Promise<PersistSummary>
//
//   PersistSummary = {
//     gameDate: string;   // YYYY-MM-DD
//     persisted: number;  // rows written
//   }
//
// Contract decisions pinned below (adjust if you disagree):
//   - Idempotent: existing rows for the date are deleted before the insert,
//     so re-running a date never duplicates rows.
//   - An empty fetch (off-day or quiet API response) persists nothing AND
//     deletes nothing — a transient empty result must not wipe good data.
//   - No repository (service constructed without a database) -> throws.

function service(stats: ReturnType<typeof makePlayerStats>[]) {
  const repository = makeRepository();
  const svc = new PlayerStatsService(makeMLBClient(), undefined, repository);
  vi.spyOn(svc, "getPlayerStatsByDate").mockResolvedValue(stats);
  return { repository, svc };
}

describe("PlayerStatsService.persistStatsForDate", () => {
  it("replaces the date's rows with freshly fetched stats", async () => {
    const stats = [
      makePlayerStats("Jackson Chourio", { points: 18 }),
      makePlayerStats("William Contreras", { points: 12 }),
    ];
    const { repository, svc } = service(stats);

    const summary = await svc.persistStatsForDate(GAME_DATE);

    expect(repository.deleteByDate).toHaveBeenCalledWith(GAME_DATE);
    expect(repository.saveBatch).toHaveBeenCalledWith(stats);
    expect(summary).toEqual({ gameDate: "2026-06-10", persisted: 2 });
  });

  it("deletes before inserting so a re-run never duplicates", async () => {
    const { repository, svc } = service([makePlayerStats("Sal Frelick")]);
    const order: string[] = [];
    (repository.deleteByDate as any).mockImplementation(async () => {
      order.push("delete");
    });
    (repository.saveBatch as any).mockImplementation(async () => {
      order.push("insert");
    });

    await svc.persistStatsForDate(GAME_DATE);

    expect(order).toEqual(["delete", "insert"]);
  });

  it("persists and deletes nothing on an empty fetch", async () => {
    const { repository, svc } = service([]);

    const summary = await svc.persistStatsForDate(GAME_DATE);

    expect(repository.deleteByDate).not.toHaveBeenCalled();
    expect(repository.saveBatch).not.toHaveBeenCalled();
    expect(summary).toEqual({ gameDate: "2026-06-10", persisted: 0 });
  });

  it("throws without a repository", async () => {
    const svc = new PlayerStatsService(makeMLBClient());

    await expect(svc.persistStatsForDate(GAME_DATE)).rejects.toThrow(
      /Database URL not provided/
    );
  });
});
