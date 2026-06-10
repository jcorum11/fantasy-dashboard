import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { StreamingResource } from "@/src/domain/models/StreamingResource";
import { IngestRun } from "@/src/domain/models/IngestRun";

export interface StreamingClients {
  fantasypros: { fetchPicks(pickDate: Date): Promise<StreamingPick[]> };
  pitcherlist: { fetchPicks(): Promise<StreamingPick[]> };
  dailywaivers: {
    fetchPicks(
      startDate: Date,
      endDate: Date,
      pickDate: Date
    ): Promise<StreamingPick[]>;
  };
}

export interface IngestRepository {
  saveBatch(picks: StreamingPick[]): Promise<void>;
  recordIngestRun(run: IngestRun): Promise<void>;
}

export interface IngestResult {
  resource: StreamingResource;
  status: "success" | "failure";
  picksCount: number;
  error: string | null;
}

export interface IngestSummary {
  results: IngestResult[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class StreamingPickIngestService {
  constructor(
    private readonly clients: StreamingClients,
    private readonly repository: IngestRepository
  ) {}

  public async ingest(pickDate: Date): Promise<IngestSummary> {
    // DailyWaivers takes an explicit range; today + tomorrow mirrors what
    // Pitcher List's article and FantasyPros' page publish for free.
    const dwEndDate = new Date(pickDate.getTime() + DAY_MS);

    const tasks: Array<{
      resource: StreamingResource;
      run: () => Promise<StreamingPick[]>;
    }> = [
      {
        resource: "fantasypros",
        run: () => this.clients.fantasypros.fetchPicks(pickDate),
      },
      {
        resource: "pitcherlist",
        run: () => this.clients.pitcherlist.fetchPicks(),
      },
      {
        resource: "dailywaivers",
        run: () =>
          this.clients.dailywaivers.fetchPicks(pickDate, dwEndDate, pickDate),
      },
    ];

    const results = await Promise.all(
      tasks.map(({ resource, run }) => this.ingestOne(resource, run, pickDate))
    );

    return { results };
  }

  private async ingestOne(
    resource: StreamingResource,
    run: () => Promise<StreamingPick[]>,
    pickDate: Date
  ): Promise<IngestResult> {
    try {
      const picks = await run();
      await this.repository.saveBatch(picks);
      await this.repository.recordIngestRun({
        resource,
        runDate: pickDate,
        status: "success",
        picksCount: picks.length,
        error: null,
      });
      return { resource, status: "success", picksCount: picks.length, error: null };
    } catch (error: any) {
      const message = error?.message || "Unknown error";
      await this.repository.recordIngestRun({
        resource,
        runDate: pickDate,
        status: "failure",
        picksCount: 0,
        error: message,
      });
      return { resource, status: "failure", picksCount: 0, error: message };
    }
  }
}
