import { StreamingResource } from "@/src/domain/models/StreamingResource";

export type RangePreset = "season" | "30" | "14" | "7";

export const RESOURCE_LABELS: Record<StreamingResource, string> = {
  fantasypros: "FantasyPros",
  pitcherlist: "Pitcher List",
  dailywaivers: "DailyWaivers",
};

export function formatAvg(avg: number | null): string {
  return avg === null ? "—" : avg.toFixed(1);
}

export function presetRange(
  preset: RangePreset,
  today: Date
): { startDate: string; endDate: string } {
  const endDate = today.toISOString().split("T")[0];
  if (preset === "season") {
    return { startDate: `${endDate.split("-")[0]}-03-01`, endDate };
  }
  const start = new Date(
    today.getTime() - Number(preset) * 24 * 60 * 60 * 1000
  );
  return { startDate: start.toISOString().split("T")[0], endDate };
}
