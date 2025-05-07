import { PlayerStats } from "../../domain/models/PlayerStats";

interface StatsTableProps {
  stats: PlayerStats[];
  viewType: "batting" | "pitching";
}

export function StatsTable({ stats, viewType }: StatsTableProps) {
  const formatPoints = (points: number | null | undefined) => {
    if (points === null || points === undefined) return "0";
    return Math.round(points).toString();
  };

  const getPointsClass = (points: number | null | undefined) => {
    if (points === null || points === undefined) return "text-slate-500";
    if (points > 0) return "text-green-600";
    if (points < 0) return "text-red-400";
    return "text-slate-500";
  };

  const getPointsBg = (points: number | null | undefined) => {
    if (points === null || points === undefined) return "";
    if (points > 0) return "bg-green-50";
    if (points < 0) return "bg-red-50";
    return "";
  };

  // Sort stats by points descending
  const sortedStats = [...stats].sort(
    (a, b) => (b.points ?? 0) - (a.points ?? 0)
  );

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="w-full bg-white border border-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 border-b border-slate-200">
              NAME
            </th>
            <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
              POINTS
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 border-b border-slate-200">
              OPP
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 border-b border-slate-200">
              POS
            </th>
            {viewType === "batting" ? (
              <>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  AB
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  H
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  HR
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  RBI
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  R
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  SB
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  BB
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  SO
                </th>
              </>
            ) : (
              <>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  IP
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  ER
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  K
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  H
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  BB
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  W
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  L
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  SV
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 border-b border-slate-200">
                  HLD
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedStats.map((player) => (
            <tr
              key={`${player.id}-${player.team}-${player.opponentTeam}-${player.position}`}
              className="border-b border-slate-200 hover:bg-slate-50"
            >
              {/* Player name and team abbreviation */}
              <td className="px-4 py-2 text-sm font-medium text-slate-900 whitespace-nowrap">
                <span className="font-semibold text-base">{player.name}</span>{" "}
                <span className="text-xs text-slate-500 align-middle font-semibold uppercase">
                  {player.team}
                </span>
              </td>
              {/* Points */}
              <td
                className={`px-4 py-2 text-sm font-bold text-center rounded ${getPointsClass(
                  player.points
                )} ${getPointsBg(player.points)}`}
              >
                {formatPoints(player.points)}
              </td>
              {/* Opponent */}
              <td className="px-4 py-2 text-sm text-slate-600">
                {player.opponentTeam}
              </td>
              {/* Position */}
              <td
                className={`px-4 py-2 text-sm font-semibold uppercase ${
                  viewType === "pitching"
                    ? player.pitchingStats.gamesStarted &&
                      player.pitchingStats.gamesStarted > 0
                      ? "text-blue-700"
                      : "text-orange-500"
                    : "text-blue-700"
                }`}
              >
                {viewType === "pitching"
                  ? player.pitchingStats.gamesStarted &&
                    player.pitchingStats.gamesStarted > 0
                    ? "SP"
                    : "RP"
                  : player.position}
              </td>
              {viewType === "batting" ? (
                <>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.atBats}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.hits}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.homeRuns}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.rbi}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.runs}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.stolenBases}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.walks}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.battingStats.strikeouts}
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.inningsPitched}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.earnedRuns}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.pitchingStrikeouts}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.hitsAllowed}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.walksIssued}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.wins}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.losses}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.saves}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">
                    {player.pitchingStats.holds ?? "-"}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
