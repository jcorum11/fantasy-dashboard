"use client";

import { useEffect, useState } from "react";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface PlayerWeekly {
  id: number;
  fullName: string;
  teamName: string;
  positionAbbr: string;
  weeklyPoints: number[];
  totalPoints: number;
  isRostered: boolean;
}

export default function WeeklyPointsPage() {
  const [players, setPlayers] = useState<PlayerWeekly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalMax, setGlobalMax] = useState<number>(0);
  const [lastWeekIndex, setLastWeekIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/weekly-points");
        if (!res.ok) throw new Error("Request failed");
        const json: PlayerWeekly[] = await res.json();

        // Determine last completed ISO week index
        const getIsoDay = (d: Date) => {
          const day = d.getDay(); // 0-6 Sun-Sat
          return day === 0 ? 7 : day; // convert to 1-7 Mon-Sun
        };
        const isoDayToday = getIsoDay(new Date());

        const weekCount = json.length > 0 ? json[0].weeklyPoints.length : 0;
        const lastCompleteWeekIndex = isoDayToday === 7 ? weekCount - 1 : weekCount - 2;
        setLastWeekIndex(lastCompleteWeekIndex);

        // Sort by total points in last complete week descending
        json.sort((a, b) => (b.weeklyPoints[lastCompleteWeekIndex] || 0) - (a.weeklyPoints[lastCompleteWeekIndex] || 0));

        setPlayers(json);

        const max = Math.max(0, ...json.flatMap((p) => p.weeklyPoints));
        setGlobalMax(max);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading weekly points...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (index === 0) {
      return (
        <div style={style} className="px-2 py-2 text-sm text-slate-600 leading-snug">
          Names shown in <span className="text-green-700 font-semibold">green</span> are currently on our waiver wire. The value displayed next to each
          player is their total fantasy points for the most recently completed ISO week. Vertical dashed lines in the mini-chart mark ISO week boundaries.
        </div>
      );
    }

    const player = players[index - 1];
    const chartData = player.weeklyPoints.map((p, i) => ({ week: i + 1, pts: p }));
    const lastWeekPts = lastWeekIndex >= 0 ? player.weeklyPoints[lastWeekIndex] || 0 : 0;

    const nameClasses = `truncate text-sm font-medium flex items-center gap-2 ${
      player.isRostered ? "" : "text-green-700 font-semibold"
    }`;

    return (
      <div
        style={style}
        className="flex items-center gap-2 border-b border-slate-200 px-2"
        key={player.id}
      >
        <div className={`w-48 ${nameClasses}`}>
          <span>{player.fullName}</span>
          {lastWeekIndex >= 0 && (
            <span className="text-xs text-slate-500">{Math.round(lastWeekPts)} pts</span>
          )}
        </div>
        <div className="flex-1 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} />
              <Line
                type="monotone"
                dataKey="pts"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="week" hide />
              <YAxis
                type="number"
                domain={[0, globalMax || 1]}
                ticks={[0, globalMax || 1]}
                tick={{ fontSize: 10 }}
                width={30}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="mb-4">
        <a
          href="/"
          className="inline-block px-3 py-2 bg-slate-200 rounded hover:bg-slate-300 text-sm font-medium"
        >
          ← Back
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-4">Weekly Fantasy Points</h1>

      <div style={{ height: "80vh" }}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              height={height}
              width={width}
              itemCount={players.length + 1 /* +1 for description */}
              itemSize={(index) => (index === 0 ? 120 : 80)}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </main>
  );
} 