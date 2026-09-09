"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SeasonWeeklyPoints, WeeklyPoints } from "@/src/domain/models/WeeklyPoints";

interface Props {
  playerId: number;
  seasons: number[];
  initial: SeasonWeeklyPoints;
}

const BAR_COLOR = "#4f46e5"; // indigo-600; validated against the light surface

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

function formatRange(w: WeeklyPoints): string {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(w.start)} – ${fmt(w.end)}`;
}

function WeekTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WeeklyPoints }> }) {
  if (!active || !payload?.length) return null;
  const w = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow">
      <div className="text-base font-semibold tabular-nums text-slate-900">
        {w.points.toFixed(1)} pts
      </div>
      <div className="text-slate-600">
        Week {w.week} · {plural(w.games, "game")}
      </div>
      <div className="text-xs text-slate-500">{formatRange(w)}</div>
    </div>
  );
}

/**
 * Weekly points bar chart for one season, with buttons to switch seasons.
 * The initial season is server-rendered; other seasons load from the API.
 */
export function SeasonWeeklyChart({ playerId, seasons, initial }: Props) {
  const [season, setSeason] = useState(initial.season);
  const [data, setData] = useState<SeasonWeeklyPoints>(initial);
  // Seasons already fetched. A ref, not state: updating it must not re-run the effect.
  const cache = useRef<Record<number, SeasonWeeklyPoints>>({ [initial.season]: initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = cache.current[season];
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/players/${playerId}/seasons/${season}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Couldn't load the ${season} season.`);
        return (await res.json()) as SeasonWeeklyPoints;
      })
      .then((result) => {
        if (cancelled) return;
        cache.current[season] = result;
        setData(result);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [season, playerId]);

  const played = data.weeks.filter((w) => w.games > 0);
  const avg = played.length ? data.totalPoints / played.length : 0;
  const best = played.reduce<WeeklyPoints | null>(
    (top, w) => (top === null || w.points > top.points ? w : top),
    null
  );

  return (
    <section aria-labelledby="weekly-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="weekly-heading" className="text-lg font-semibold text-slate-900">
          {data.season} weekly points
        </h2>
        <p className="text-sm text-slate-500" aria-live="polite">
          {loading ? "Loading…" : error ?? `${plural(data.games, "game")} · ${plural(played.length, "week")} played`}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Total" value={data.totalPoints.toFixed(1)} />
        <Stat label="Avg / week played" value={avg.toFixed(1)} />
        <Stat label="Best week" value={best ? `${best.points.toFixed(1)} (wk ${best.week})` : "—"} />
      </dl>

      <div className={`mt-4 h-72 w-full ${loading ? "opacity-50" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.weeks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              tick={{ fill: "#64748b", fontSize: 12 }}
              interval={data.weeks.length > 20 ? 2 : 0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={56}
            />
            <Tooltip content={<WeekTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Bar
              dataKey="points"
              fill={BAR_COLOR}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Season">
        {seasons.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setSeason(y)}
            aria-pressed={y === season}
            disabled={loading && y !== season}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              y === season
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-slate-600">Week-by-week table</summary>
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">Week</th>
                <th scope="col" className="px-4 py-2">Dates</th>
                <th scope="col" className="px-4 py-2 text-right">G</th>
                <th scope="col" className="px-4 py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.weeks.map((w) => (
                <tr key={w.week}>
                  <td className="px-4 py-2 tabular-nums">{w.week}</td>
                  <td className="px-4 py-2 text-slate-600">{formatRange(w)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{w.games}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{w.points.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
