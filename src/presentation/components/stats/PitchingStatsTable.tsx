import { PlayerStats } from "../../../domain/models/PlayerStats";
import {
  TableHeader,
  TableCell,
  PlayerNameCell,
  PointsCell,
} from "./TableElements";
import {
  formatPoints,
  getPointsClass,
  getPointsBg,
} from "../utils/statsFormatting";

interface PitchingStatsTableProps {
  stats: PlayerStats[];
}

export function PitchingStatsTable({ stats }: PitchingStatsTableProps) {
  return (
    <table className="w-full bg-white border border-slate-200">
      <thead>
        <tr>
          <TableHeader>NAME</TableHeader>
          <TableHeader align="right">POINTS</TableHeader>
          <TableHeader>OPP</TableHeader>
          <TableHeader>POS</TableHeader>
          <TableHeader align="right">IP</TableHeader>
          <TableHeader align="right">ER</TableHeader>
          <TableHeader align="right">K</TableHeader>
          <TableHeader align="right">H</TableHeader>
          <TableHeader align="right">BB</TableHeader>
          <TableHeader align="right">W</TableHeader>
          <TableHeader align="right">L</TableHeader>
          <TableHeader align="right">SV</TableHeader>
          <TableHeader align="right">HLD</TableHeader>
        </tr>
      </thead>
      <tbody>
        {stats.map((player) => (
          <tr
            key={`${player.id}-${player.team}-${player.opponentTeam}-${player.position}-${player.isPositionPlayerPitching}`}
            className="border-b border-slate-200 hover:bg-slate-50"
          >
            <PlayerNameCell name={player.name} team={player.team} />
            <PointsCell
              points={player.points}
              formatPoints={formatPoints}
              getPointsClass={getPointsClass}
              getPointsBg={getPointsBg}
            />
            <TableCell>{player.opponentTeam}</TableCell>
            <TableCell className="font-semibold uppercase text-blue-700">
              {player.position}
            </TableCell>
            <TableCell align="right">
              {player.pitchingStats.inningsPitched}
            </TableCell>
            <TableCell align="right">
              {player.pitchingStats.earnedRuns}
            </TableCell>
            <TableCell align="right">
              {player.pitchingStats.pitchingStrikeouts}
            </TableCell>
            <TableCell align="right">
              {player.pitchingStats.hitsAllowed}
            </TableCell>
            <TableCell align="right">
              {player.pitchingStats.walksIssued}
            </TableCell>
            <TableCell align="right">{player.pitchingStats.wins}</TableCell>
            <TableCell align="right">{player.pitchingStats.losses}</TableCell>
            <TableCell align="right">{player.pitchingStats.saves}</TableCell>
            <TableCell align="right">
              {player.pitchingStats.holds ?? "-"}
            </TableCell>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
