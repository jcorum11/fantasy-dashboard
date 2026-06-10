import { StreamingResource } from "@/src/domain/models/StreamingResource";

export interface IngestRun {
  resource: StreamingResource;
  runDate: Date;
  status: "success" | "failure";
  picksCount: number;
  error: string | null;
}
