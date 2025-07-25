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
    <div className="relative overflow-auto max-h-[600px]">
      <table className="w-full bg-white border border-slate-200">
        <thead className="sticky top-0 z-10 bg-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <tr>
            <TableHeader className="sticky left-0 z-20 bg-white border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
              NAME
            </TableHeader>
            <TableHeader align="center">POINTS</TableHeader>
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
          {stats.map((player) => {
            const savantUrl = `https://baseballsavant.mlb.com/savant-player/${player.id}`;
            return (
              <tr
                key={`${player.id}-${player.team}-${player.opponentTeam}-${player.position}-${player.isPositionPlayerPitching}`}
                className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                onClick={() => window.open(savantUrl, "_blank")}
              >
                <PlayerNameCell
                  name={player.name}
                  team={player.team}
                  isRostered={(player as any).isRostered}
                  className="sticky left-0 z-10 bg-white hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                />
                <PointsCell
                  points={player.points}
                  formatPoints={formatPoints}
                  getPointsClass={getPointsClass}
                  getPointsBg={getPointsBg}
                />
                <TableCell>
                  {!player.isHomeTeam ? "@" : ""}
                  {player.opponentTeam}
                </TableCell>
                <TableCell
                  className={`font-semibold uppercase ${
                    player.pitchingStats.gamesStarted > 0
                      ? "text-indigo-700"
                      : "text-emerald-700"
                  }`}
                >
                  {player.pitchingStats.gamesStarted > 0 ? "SP" : "RP"}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.inningsPitched}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.earnedRuns}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.pitchingStrikeouts}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.hitsAllowed}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.walksIssued}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.wins}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.losses}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.saves}
                </TableCell>
                <TableCell align="right" className="text-slate-600">
                  {player.pitchingStats.holds ?? "-"}
                </TableCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
