import { describe, expect, it } from "vitest";
import { StreamingPickIngestService } from "@/src/application/services/StreamingPickIngestService";
import {
  makeClients,
  makePick,
  makeRepository,
} from "@/src/application/services/StreamingPickIngestService.mocks";

// Assumed contract (drives the implementation):
//   new StreamingPickIngestService(clients, repository)
//     .ingest(pickDate) -> Promise<IngestSummary>
//
//   IngestSummary = {
//     results: Array<{
//       resource: StreamingResource;
//       status: "success" | "failure";
//       picksCount: number;   // 0 on failure
//       error: string | null; // message on failure
//     }>;
//   }
//
// Contract decisions pinned below (adjust if you disagree):
//   - All three clients always run; one failing NEVER blocks the others
//     (the degradation rule — especially FantasyPros).
//   - Successful batches are persisted via repository.saveBatch per resource.
//   - EVERY run is recorded via repository.recordIngestRun (success AND
//     failure) so the UI can distinguish "failed" from "no picks".
//   - A repository.saveBatch failure counts as that resource's failure too.
//   - The summary always lists all three resources in a stable order.

const PICK_DATE = new Date("2026-06-10T00:00:00Z");

describe("StreamingPickIngestService", () => {
  it("ingests all three resources and persists each batch", async () => {
    const clients = makeClients({});
    const repository = makeRepository();
    const service = new StreamingPickIngestService(clients, repository);

    const summary = await service.ingest(PICK_DATE);

    expect(summary.results).toEqual([
      { resource: "fantasypros", status: "success", picksCount: 1, error: null },
      { resource: "pitcherlist", status: "success", picksCount: 1, error: null },
      { resource: "dailywaivers", status: "success", picksCount: 2, error: null },
    ]);
    expect(repository.saveBatch).toHaveBeenCalledTimes(3);
  });

  it("a failing client does not block the others (FantasyPros down)", async () => {
    const clients = makeClients({
      fantasypros: () =>
        Promise.reject(new Error("FantasyPros request failed: 403")),
    });
    const repository = makeRepository();
    const service = new StreamingPickIngestService(clients, repository);

    const summary = await service.ingest(PICK_DATE);

    const fp = summary.results.find((r) => r.resource === "fantasypros")!;
    expect(fp.status).toBe("failure");
    expect(fp.error).toMatch(/403/);
    expect(fp.picksCount).toBe(0);

    const others = summary.results.filter((r) => r.resource !== "fantasypros");
    expect(others.every((r) => r.status === "success")).toBe(true);
    expect(repository.saveBatch).toHaveBeenCalledTimes(2);
  });

  it("records an ingest run for every resource, success and failure", async () => {
    const clients = makeClients({
      pitcherlist: () => Promise.reject(new Error("markup drift?")),
    });
    const repository = makeRepository();
    const service = new StreamingPickIngestService(clients, repository);

    await service.ingest(PICK_DATE);

    expect(repository.recordIngestRun).toHaveBeenCalledTimes(3);
    const runs = repository.recordIngestRun.mock.calls.map((c) => c[0]);
    expect(runs).toContainEqual(
      expect.objectContaining({
        resource: "pitcherlist",
        runDate: PICK_DATE,
        status: "failure",
        error: expect.stringMatching(/markup drift/),
        picksCount: 0,
      })
    );
    expect(runs).toContainEqual(
      expect.objectContaining({
        resource: "dailywaivers",
        status: "success",
        picksCount: 2,
        error: null,
      })
    );
  });

  it("treats a saveBatch failure as that resource's failure", async () => {
    const clients = makeClients({});
    const repository = makeRepository();
    repository.saveBatch.mockImplementation((picks) =>
      picks[0]?.resource === "dailywaivers"
        ? Promise.reject(new Error("db down"))
        : Promise.resolve()
    );
    const service = new StreamingPickIngestService(clients, repository);

    const summary = await service.ingest(PICK_DATE);

    const dw = summary.results.find((r) => r.resource === "dailywaivers")!;
    expect(dw.status).toBe("failure");
    expect(dw.error).toMatch(/db down/);

    const fp = summary.results.find((r) => r.resource === "fantasypros")!;
    expect(fp.status).toBe("success");
  });

  it("a client returning zero picks records success with picksCount 0", async () => {
    const clients = makeClients({
      pitcherlist: () => Promise.resolve([]),
    });
    const repository = makeRepository();
    const service = new StreamingPickIngestService(clients, repository);

    const summary = await service.ingest(PICK_DATE);

    const pl = summary.results.find((r) => r.resource === "pitcherlist")!;
    expect(pl).toEqual({
      resource: "pitcherlist",
      status: "success",
      picksCount: 0,
      error: null,
    });
  });
});
