"use client";

import { useState, useEffect } from "react";

interface MLBPlayer {
  person: {
    id: number;
    fullName: string;
  };
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  team: {
    id: number;
    name: string;
  };
  stats: {
    batting: {
      gamesPlayed: number;
      atBats: number;
      runs: number;
      hits: number;
      doubles: number;
      triples: number;
      homeRuns: number;
      rbi: number;
      stolenBases: number;
      caughtStealing: number;
      walks: number;
      strikeOuts: number;
      battingAverage: string;
      onBasePercentage: string;
      sluggingPercentage: string;
      ops: string;
    };
    pitching: {
      gamesPlayed: number;
      inningsPitched: number;
      wins: number;
      saves: number;
      strikeOuts: number;
      era: string;
    };
  };
  fantasyPoints: number;
}

// Position mapping
const POSITION_MAP: Record<string, string> = {
  "1": "Pitcher",
  "2": "Catcher",
  "3": "First Base",
  "4": "Second Base",
  "5": "Third Base",
  "6": "Shortstop",
  "7": "Outfield",
  "8": "Outfield",
  "9": "Outfield",
  "10": "Designated Hitter",
  P: "Pitcher",
  C: "Catcher",
  "1B": "First Base",
  "2B": "Second Base",
  "3B": "Third Base",
  SS: "Shortstop",
  LF: "Outfield",
  CF: "Outfield",
  RF: "Outfield",
  DH: "Designated Hitter",
  SP: "Starting Pitcher",
  RP: "Relief Pitcher",
  UTIL: "Utility",
  Unknown: "Unknown",
};

// Function to get full position name
function getFullPositionName(positionCode: string): string {
  return POSITION_MAP[positionCode] || positionCode;
}

interface TopPerformersProps {
  players: MLBPlayer[];
}

// Add these constants near the top of the file
const LEAGUE_SIZE = 7; // Number of teams in the league
const POSITION_SLOTS: Record<string, number> = {
  Catcher: 1,
  "First Base": 1,
  "Second Base": 1,
  "Third Base": 1,
  Shortstop: 1,
  Outfield: 3,
  "Designated Hitter": 1,
  Utility: 1,
  "Starting Pitcher": 3,
  "Relief Pitcher": 4,
};

// Add this function to calculate replacement level
function getReplacementLevelIndex(position: string): number {
  const slotsPerTeam = POSITION_SLOTS[position] || 1;
  return LEAGUE_SIZE * slotsPerTeam;
}

// Update the color function to use replacement level
function getPlayerCardColor(
  player: MLBPlayer,
  position: string,
  index: number
): string {
  const replacementLevelIndex = getReplacementLevelIndex(position);

  if (index < replacementLevelIndex * 0.5)
    return "bg-green-50 hover:bg-green-100"; // Top 50% of starters
  if (index < replacementLevelIndex) return "bg-blue-50 hover:bg-blue-100"; // Above replacement
  return "bg-gray-50 hover:bg-gray-100"; // Below replacement
}

// Update the position toolbar section to sort positions in a logical order
const POSITION_ORDER = [
  "Catcher",
  "First Base",
  "Second Base",
  "Third Base",
  "Shortstop",
  "Outfield",
  "Designated Hitter",
  "Utility",
  "Starting Pitcher",
  "Relief Pitcher",
];

export default function TopPerformers() {
  const [players, setPlayers] = useState<MLBPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        const response = await fetch("/api/replacement-level");
        if (!response.ok) {
          throw new Error("Failed to fetch top performers");
        }
        const data = await response.json();

        // Handle API response with error message
        if (data.error) {
          setMessage(data.message || "No data available");
          setPlayers([]);
          return;
        }

        setPlayers(data);
        setMessage(null);

        // Extract unique positions and set the first one as selected
        const uniquePositions = Array.from(
          new Set(
            data.map((player: MLBPlayer) =>
              getFullPositionName(player.position.abbreviation)
            )
          )
        ).filter((pos): pos is string => typeof pos === "string");

        setPositions(uniquePositions);
        if (uniquePositions.length > 0) {
          setSelectedPosition(uniquePositions[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setMessage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No player data is currently available. This could be because:
                <ul className="list-disc list-inside mt-2">
                  <li>The season hasn't started yet</li>
                  <li>There was an issue fetching the data</li>
                  <li>The API is temporarily unavailable</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group players by position
  const playersByPosition = players.reduce((acc, player) => {
    const position = getFullPositionName(player.position.abbreviation);
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(player);
    return acc;
  }, {} as Record<string, MLBPlayer[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Top Performers by Position</h1>

      {/* Position Toolbar */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {POSITION_ORDER.map(
            (position) =>
              positions.includes(position) && (
                <button
                  key={position}
                  onClick={() => setSelectedPosition(position)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPosition === position
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {position}
                </button>
              )
          )}
        </div>
      </div>

      {/* Selected Position Players */}
      {selectedPosition && playersByPosition[selectedPosition] && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playersByPosition[selectedPosition].map((player, index) => (
            <div
              key={player.person.id}
              className={`p-4 rounded-lg shadow-sm border border-gray-200 ${getPlayerCardColor(
                player,
                selectedPosition,
                index
              )} transition-colors duration-200`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">
                    {player.person.fullName}
                  </h3>
                  <p className="text-sm text-gray-600">{player.team.name}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded mb-1">
                    {player.position.abbreviation}
                  </span>
                  <span className="text-xs text-gray-500">
                    Rank: {index + 1}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-green-600">
                  {player.fantasyPoints.toFixed(1)} pts
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {player.stats.batting ? (
                    <>
                      <div>
                        <span className="text-gray-500">G:</span>{" "}
                        {player.stats.batting.gamesPlayed}
                      </div>
                      <div>
                        <span className="text-gray-500">AVG:</span>{" "}
                        {player.stats.batting.battingAverage}
                      </div>
                      <div>
                        <span className="text-gray-500">HR:</span>{" "}
                        {player.stats.batting.homeRuns}
                      </div>
                      <div>
                        <span className="text-gray-500">RBI:</span>{" "}
                        {player.stats.batting.rbi}
                      </div>
                      <div>
                        <span className="text-gray-500">SB:</span>{" "}
                        {player.stats.batting.stolenBases}
                      </div>
                      <div>
                        <span className="text-gray-500">OPS:</span>{" "}
                        {player.stats.batting.ops}
                      </div>
                    </>
                  ) : player.stats.pitching ? (
                    <>
                      <div>
                        <span className="text-gray-500">G:</span>{" "}
                        {player.stats.pitching.gamesPlayed}
                      </div>
                      <div>
                        <span className="text-gray-500">IP:</span>{" "}
                        {player.stats.pitching.inningsPitched}
                      </div>
                      <div>
                        <span className="text-gray-500">W:</span>{" "}
                        {player.stats.pitching.wins}
                      </div>
                      <div>
                        <span className="text-gray-500">SV:</span>{" "}
                        {player.stats.pitching.saves}
                      </div>
                      <div>
                        <span className="text-gray-500">K:</span>{" "}
                        {player.stats.pitching.strikeOuts}
                      </div>
                      <div>
                        <span className="text-gray-500">ERA:</span>{" "}
                        {player.stats.pitching.era}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
