"use client";
import { format, parse } from "date-fns";
import { PlayerStats } from "@/lib/db";
import { useState, useEffect } from "react";
import {
  getYesterdayMLB,
  getNextValidDate,
  getPreviousValidDate,
  canNavigateToDate,
  getMLBDate,
} from "@/lib/mlb/dates";

async function getPlayerStats(date?: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`);
  if (date) {
    url.searchParams.append("date", date);
  }
  // Add a cache-busting parameter
  url.searchParams.append("nocache", Date.now().toString());

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store", // Disable caching
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        stats: [],
        error: errorData.error || "Failed to fetch stats",
        date,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      stats: [],
      error: "Network error. Please try again later.",
      date,
    };
  }
}

export default function Home() {
  const [viewType, setViewType] = useState<"batting" | "pitching">("batting");
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const yesterday = getYesterdayMLB();
    return yesterday;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const formattedDate = format(
    parse(currentDate, "yyyy-MM-dd", new Date()),
    "MMM d, yyyy"
  );

  // Fetch stats on component mount or when date changes
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setMessage("");
      try {
        const data = await getPlayerStats(currentDate);
        setStats(data.stats || []);
        if (data.error) {
          setMessage(data.error);
        } else if (data.message) {
          setMessage(data.message);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setMessage("Error fetching stats. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentDate]);

  // Navigation functions
  const goToPreviousDay = () => {
    const prevDate = getPreviousValidDate(currentDate);
    setCurrentDate(prevDate);
  };

  const goToNextDay = () => {
    const nextDate = getNextValidDate(currentDate);
    if (nextDate) {
      setCurrentDate(nextDate);
    } else {
      console.log("Next date is null, cannot navigate forward");
    }
  };

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
    if (points === null || points === undefined) return "0";
    return Math.round(points).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 py-8 px-2 md:px-0">
      <main className="mx-auto max-w-6xl">
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-200">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-2 tracking-tight drop-shadow-sm">
            Fantasy Baseball Dashboard
          </h1>

          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg text-slate-500 font-medium">
              Top Performers for{" "}
              <span className="font-semibold text-slate-700">
                {formattedDate}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={goToPreviousDay}
                disabled={isLoading}
                className="px-3 py-1 rounded-lg font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous Day
              </button>
              <button
                onClick={goToNextDay}
                disabled={isLoading || !getNextValidDate(currentDate)}
                className="px-3 py-1 rounded-lg font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Day
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-4">
              {message}
            </div>
          )}

          {/* View Type Toggle */}
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading stats...</p>
            </div>
          )}

          {/* Stats Tables */}
          {!isLoading && (
            <div className="overflow-x-auto">
              {viewType === "batting" ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-4 py-3 font-semibold rounded-l-xl bg-slate-50">
                        NAME
                      </th>
                      <th className="px-4 py-3 text-center font-semibold bg-slate-50">
                        POINTS
                      </th>
                      <th className="px-4 py-3 font-semibold bg-slate-50">
                        OPP
                      </th>
                      <th className="px-4 py-3 font-semibold bg-slate-50">
                        POS
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        AB
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        H
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        HR
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        RBI
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        R
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        SB
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        BB
                      </th>
                      <th className="px-4 py-3 text-center font-semibold rounded-r-xl bg-slate-50">
                        K
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {battingStats.map((player: PlayerStats) => (
                      <tr
                        key={`${player.id}-${player.gameDate}`}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {player.name}{" "}
                            <span className="text-sm text-slate-500 font-medium">
                              {player.team}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-center font-bold text-lg ${
                            (player.points || 0) >= 0
                              ? "text-green-600 bg-green-50"
                              : "text-red-600 bg-red-50"
                          }`}
                        >
                          {formatPoints(player.points)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {player.opponentTeam}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap font-bold ${
                            player.position === "SP"
                              ? "text-blue-600"
                              : player.position === "RP"
                              ? "text-orange-600"
                              : "text-indigo-700"
                          }`}
                        >
                          {player.position}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.atBats || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.hits || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.homeRuns || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.rbi || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.runs || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.stolenBases || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.battingStats?.walks || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 rounded-r-xl">
                          {player.battingStats?.strikeouts || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-4 py-3 font-semibold rounded-l-xl bg-slate-50">
                        NAME
                      </th>
                      <th className="px-4 py-3 text-center font-semibold bg-slate-50">
                        POINTS
                      </th>
                      <th className="px-4 py-3 font-semibold bg-slate-50">
                        OPP
                      </th>
                      <th className="px-4 py-3 font-semibold bg-slate-50">
                        POS
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        IP
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        ER
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        K
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        H
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        BB
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        W
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        L
                      </th>
                      <th className="px-2 py-3 text-center font-semibold bg-slate-50">
                        SV
                      </th>
                      <th className="px-4 py-3 text-center font-semibold rounded-r-xl bg-slate-50">
                        HLD
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pitchingStats.map((player: PlayerStats) => (
                      <tr
                        key={`${player.id}-${player.gameDate}`}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {player.name}{" "}
                            <span className="text-sm text-slate-500 font-medium">
                              {player.team}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-center font-bold text-lg ${
                            (player.points || 0) >= 0
                              ? "text-green-600 bg-green-50"
                              : "text-red-600 bg-red-50"
                          }`}
                        >
                          {formatPoints(player.points)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {player.opponentTeam}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap font-bold ${
                            player.position === "SP"
                              ? "text-blue-600"
                              : player.position === "RP"
                              ? "text-orange-600"
                              : "text-indigo-700"
                          }`}
                        >
                          {player.position}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.inningsPitched || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.earnedRuns || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.pitchingStrikeouts || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.hitsAllowed || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.walksIssued || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.wins || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.losses || 0}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-600">
                          {player.pitchingStats?.saves || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 rounded-r-xl">
                          {player.pitchingStats?.holds !== null
                            ? player.pitchingStats?.holds
                            : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
