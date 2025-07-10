"use client";

import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import PlayerRow from "@/src/presentation/weeklyPoints/PlayerRow";
import { useWeeklyPoints } from "@/src/presentation/weeklyPoints/useWeeklyPoints";
import { defaultDisplayPointsStrategy } from "@/src/presentation/weeklyPoints/displayPointsStrategy";

function WeeklyPointsContent() {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const season =
    seasonParam && !Number.isNaN(Number(seasonParam))
      ? Number(seasonParam)
      : undefined;

  const { players, loading, error, lastWeekIdx, globalMax } =
    useWeeklyPoints(season);

  const [searchTerm, setSearchTerm] = useState("");
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return players.filter((p) => p.fullName.toLowerCase().includes(term));
  }, [players, searchTerm]);

  const getItemSize = useCallback(
    (index: number) => (index === 0 ? 120 : 80),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading weekly points…
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

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <a
          href="/"
          className="inline-block px-3 py-2 bg-slate-200 rounded hover:bg-slate-300 text-sm font-medium"
        >
          ← Back
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-4">Weekly Fantasy Points</h1>

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search player…"
          className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded"
        />
      </div>

      <div style={{ height: "80vh" }}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              height={height}
              width={width}
              itemCount={filtered.length + 1}
              itemSize={getItemSize}
            >
              {({ index, style }) =>
                index === 0 ? (
                  <div
                    style={style}
                    className="px-2 py-2 text-sm text-slate-600 leading-snug"
                  >
                    Names shown in{" "}
                    <span className="text-green-700 font-semibold">green</span>{" "}
                    are currently on our waiver wire. The value displayed next
                    to each player is their total fantasy points for the most
                    recently completed ISO week. Vertical dashed lines in the
                    mini-chart mark ISO week boundaries. Click any row to open
                    that player’s Baseball Savant page.
                  </div>
                ) : (
                  <PlayerRow
                    player={filtered[index - 1]}
                    lastWeekIdx={lastWeekIdx}
                    globalMax={globalMax}
                    style={style}
                    displayPoints={defaultDisplayPointsStrategy}
                  />
                )
              }
            </List>
          )}
        </AutoSizer>
      </div>
    </main>
  );
}

export default function WeeklyPointsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading weekly points…
        </div>
      }
    >
      <WeeklyPointsContent />
    </Suspense>
  );
} 