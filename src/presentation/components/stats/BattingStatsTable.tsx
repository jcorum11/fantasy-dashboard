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

interface BattingStatsTableProps {
  stats: PlayerStats[];
}

export function BattingStatsTable({ stats }: BattingStatsTableProps) {
  return (
    <table className="w-full bg-white border border-slate-200">
      <thead>
        <tr>
          <TableHeader>NAME</TableHeader>
          <TableHeader align="right">POINTS</TableHeader>
          <TableHeader>OPP</TableHeader>
          <TableHeader>POS</TableHeader>
          <TableHeader align="right">AB</TableHeader>
          <TableHeader align="right">H</TableHeader>
          <TableHeader align="right">HR</TableHeader>
          <TableHeader align="right">RBI</TableHeader>
          <TableHeader align="right">R</TableHeader>
          <TableHeader align="right">SB</TableHeader>
          <TableHeader align="right">BB</TableHeader>
          <TableHeader align="right">K</TableHeader>
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
            <TableCell align="right">{player.battingStats.atBats}</TableCell>
            <TableCell align="right">{player.battingStats.hits}</TableCell>
            <TableCell align="right">{player.battingStats.homeRuns}</TableCell>
            <TableCell align="right">{player.battingStats.rbi}</TableCell>
            <TableCell align="right">{player.battingStats.runs}</TableCell>
            <TableCell align="right">
              {player.battingStats.stolenBases}
            </TableCell>
            <TableCell align="right">{player.battingStats.walks}</TableCell>
            <TableCell align="right">
              {player.battingStats.strikeouts}
            </TableCell>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
