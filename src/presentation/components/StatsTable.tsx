import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { BattingStatsTable } from "@/src/presentation/components/stats/BattingStatsTable";
import { PitchingStatsTable } from "@/src/presentation/components/stats/PitchingStatsTable";

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

  // Deduplicate stats by a composite key (id, team, opponentTeam, position, isPositionPlayerPitching)
  const dedupedStats = Array.from(
    new Map(
      sortedStats.map((player) => [
        `${player.id}-${player.team}-${player.opponentTeam}-${player.position}-${player.isPositionPlayerPitching}`,
        player,
      ])
    ).values()
  );

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      {viewType === "batting" ? (
        <BattingStatsTable stats={dedupedStats} />
      ) : (
        <PitchingStatsTable stats={dedupedStats} />
      )}
    </div>
  );
}
