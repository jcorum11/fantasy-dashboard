"use client";
import { format, subDays } from "date-fns";
import { PlayerStats } from "@/lib/db";
import { useState, useEffect } from "react";

async function getPlayerStats() {
  const response = await fetch("http://localhost:3000/api/stats", {
    next: { revalidate: 3600 },
  });
  const data = await response.json();
  return data.stats || [];
}

export default function Home() {
  const [viewType, setViewType] = useState<"batting" | "pitching">("batting");
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const yesterday = format(subDays(new Date(), 1), "MMM d, yyyy");

  // Fetch stats on component mount
  useEffect(() => {
    getPlayerStats().then(setStats);
  }, []);

  // Separate batting stats
  const battingStats = stats
    .filter(
      (player: PlayerStats) =>
        (player.battingStats?.atBats || 0) > 0 ||
        (player.battingStats?.walks || 0) > 0 ||
        (player.battingStats?.strikeouts || 0) > 0
    )
    .filter(
      (player: PlayerStats, index: number, self: PlayerStats[]) =>
        index === self.findIndex((p: PlayerStats) => p.id === player.id)
    )
    .sort(
      (a: PlayerStats, b: PlayerStats) => (b.points || 0) - (a.points || 0)
    );

  // Separate pitching stats
  const pitchingStats = stats
    .filter(
      (player: PlayerStats) =>
        (player.pitchingStats?.inningsPitched || 0) > 0 ||
        (player.pitchingStats?.pitchingStrikeouts || 0) > 0
    )
    .filter(
      (player: PlayerStats, index: number, self: PlayerStats[]) =>
        index === self.findIndex((p: PlayerStats) => p.id === player.id)
    )
    .sort(
      (a: PlayerStats, b: PlayerStats) => (b.points || 0) - (a.points || 0)
    );

  const formatPoints = (points: number | null | undefined) => {
    if (points === null || points === undefined) return "0.00";
    return points.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 py-8 px-2 md:px-0">
      <main className="mx-auto max-w-6xl">
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-200">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-2 tracking-tight drop-shadow-sm">
            Fantasy Baseball Dashboard
          </h1>
          <p className="text-lg text-slate-500 mb-4 font-medium">
            Top Performers for{" "}
            <span className="font-semibold text-slate-700">{yesterday}</span>
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewType("batting")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewType === "batting"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Batting
            </button>
            <button
              onClick={() => setViewType("pitching")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewType === "pitching"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pitching
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/80">
            {viewType === "batting" ? (
              <table className="min-w-full divide-y divide-slate-200 text-sm md:text-base">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                      Pos
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      AB
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      H
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      HR
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      RBI
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      R
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      SB
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      BB
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      K
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 rounded-tr-xl">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {battingStats.map((player: PlayerStats, idx: number) => (
                    <tr
                      key={`${player.id}-${player.gameDate}-${idx}`}
                      className={`transition-colors duration-150 ${
                        idx % 2 === 0 ? "bg-white/70" : "bg-slate-50/80"
                      } hover:bg-indigo-50/80`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">
                        {player.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {player.team}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-indigo-700 font-bold">
                        {player.position}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.atBats || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.hits || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.homeRuns || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.rbi || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.runs || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.stolenBases || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.walks || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.battingStats?.strikeouts || 0}
                      </td>
                      <td
                        className={`px-4 py-3 text-center font-bold text-lg rounded-r-xl ${
                          (player.points || 0) >= 0
                            ? "text-green-600 bg-green-50"
                            : "text-red-600 bg-red-50"
                        }`}
                      >
                        {formatPoints(player.points)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm md:text-base">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                      Pos
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      ER
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      K
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      H
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      BB
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      W
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      L
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      SV
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                      HLD
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 rounded-tr-xl">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pitchingStats.map((player: PlayerStats, idx: number) => (
                    <tr
                      key={`${player.id}-${player.gameDate}-${idx}`}
                      className={`transition-colors duration-150 ${
                        idx % 2 === 0 ? "bg-white/70" : "bg-slate-50/80"
                      } hover:bg-indigo-50/80`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">
                        {player.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {player.team}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-indigo-700 font-bold">
                        {player.position}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.inningsPitched.toFixed(1) ||
                          "0.0"}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.earnedRuns || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.pitchingStrikeouts || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.hitsAllowed || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.walksIssued || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.wins || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.losses || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.saves || 0}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {player.pitchingStats?.holds || 0}
                      </td>
                      <td
                        className={`px-4 py-3 text-center font-bold text-lg rounded-r-xl ${
                          (player.points || 0) >= 0
                            ? "text-green-600 bg-green-50"
                            : "text-red-600 bg-red-50"
                        }`}
                      >
                        {formatPoints(player.points)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
