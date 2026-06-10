"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ComparisonReport } from "@/src/application/services/StreamingComparisonService";
import { DailyBreakdown } from "@/src/application/services/DailyBreakdownService";
import { DateNavigation } from "@/src/presentation/components/DateNavigation";
import { ComparisonGrid } from "@/src/presentation/streaming/ComparisonGrid";
import { DailyBreakdownTable } from "@/src/presentation/streaming/DailyBreakdownTable";
import { ResourceHealth } from "@/src/presentation/streaming/ResourceHealth";
import { TierBreakdown } from "@/src/presentation/streaming/TierBreakdown";
import {
  presetRange,
  RangePreset,
} from "@/src/presentation/streaming/formatting";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "season", label: "Season" },
  { value: "30", label: "Last 30 days" },
  { value: "14", label: "Last 14 days" },
  { value: "7", label: "Last 7 days" },
];

function yesterday(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export default function PitcherStreaming() {
  const [preset, setPreset] = useState<RangePreset>("season");
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dailyDate, setDailyDate] = useState<Date>(yesterday);
  const [daily, setDaily] = useState<DailyBreakdown | null>(null);
  const [isDailyLoading, setIsDailyLoading] = useState(true);

  useEffect(() => {
    setIsDailyLoading(true);
    fetch(
      `/api/streaming-picks/daily?date=${format(dailyDate, "yyyy-MM-dd")}`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        setDaily(await res.json());
      })
      .catch(() => setDaily(null))
      .finally(() => setIsDailyLoading(false));
  }, [dailyDate]);

  useEffect(() => {
    const { startDate, endDate } = presetRange(preset, new Date());
    setIsLoading(true);
    setError(null);

    fetch(
      `/api/streaming-picks/comparison?startDate=${startDate}&endDate=${endDate}`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        setReport(await res.json());
      })
      .catch((err: any) => setError(err?.message || "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [preset]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Pitcher Streaming
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        How accurate is each streaming resource? Average Yahoo fantasy points
        per recommended start, by overall list and by rank segment. Picks
        whose pitcher didn&apos;t take the mound are excluded from averages.
      </p>

      <div className="mb-4 flex gap-2">
        {PRESETS.map(({ value, label }) => {
          const isActive = preset === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setPreset(value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading && <p className="text-slate-500">Loading comparison…</p>}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</p>
      )}

      {!isLoading && !error && report && (
        <div className="space-y-8">
          <ResourceHealth resources={report.resources} />

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <ComparisonGrid resources={report.resources} />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <TierBreakdown resources={report.resources} />
          </div>

          <p className="text-xs text-slate-400">
            High/Mid/Low are rank terciles computed within each day&apos;s
            list per resource, so differently-sized lists stay comparable.
            {" "}Range: {report.startDate} → {report.endDate}.
          </p>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-bold text-slate-900">
              Daily winners &amp; losers
            </h2>
            <p className="text-sm text-slate-600">
              Every listed pitcher with each resource&apos;s call and the
              actual result. W = correct call (a high pick that hit, or a low
              pick that bombed); L = wrong call (a high pick that bombed, or
              a buried gem).
            </p>
            <DateNavigation
              label="Streaming picks for"
              currentDate={dailyDate}
              isLoading={isDailyLoading}
              onPreviousDay={() =>
                setDailyDate(new Date(dailyDate.getTime() - 24 * 60 * 60 * 1000))
              }
              onNextDay={() =>
                setDailyDate(new Date(dailyDate.getTime() + 24 * 60 * 60 * 1000))
              }
              canNavigateNext={
                dailyDate.getTime() < Date.now() - 24 * 60 * 60 * 1000
              }
            />
            {isDailyLoading && (
              <p className="text-slate-500">Loading daily breakdown…</p>
            )}
            {!isDailyLoading && daily && daily.pitchers.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <DailyBreakdownTable breakdown={daily} />
              </div>
            )}
            {!isDailyLoading && daily && daily.pitchers.length === 0 && (
              <p className="text-slate-500">No picks recorded for this date.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
