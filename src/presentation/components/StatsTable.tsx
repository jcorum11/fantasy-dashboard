import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { BattingStatsTable } from "@/src/presentation/components/stats/BattingStatsTable";
import { PitchingStatsTable } from "@/src/presentation/components/stats/PitchingStatsTable";

interface StatsTableProps {
  stats: PlayerStats[];
  viewType: "batting" | "pitching";
}

export function StatsTable({ stats, viewType }: StatsTableProps) {
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
