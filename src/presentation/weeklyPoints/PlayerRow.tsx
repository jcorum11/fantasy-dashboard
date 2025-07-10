import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { PlayerWeekly } from "./types";
import { DisplayPointsStrategy } from "./displayPointsStrategy";

export interface PlayerRowProps {
  player: PlayerWeekly;
  lastWeekIdx: number;
  globalMax: number;
  style: React.CSSProperties;
  displayPoints: DisplayPointsStrategy;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  lastWeekIdx,
  globalMax,
  style,
  displayPoints,
}) => {
  const chartData = useMemo(
    () =>
      player.weeklyPoints.map((p, i) => ({
        week: i + 1,
        pts: p,
      })),
    [player.weeklyPoints]
  );

  const points = displayPoints(player.weeklyPoints, lastWeekIdx);
  const savantUrl = `https://baseballsavant.mlb.com/savant-player/${player.id}`;
  const nameClasses = `truncate text-sm font-medium flex items-center gap-2 ${
    player.isRostered ? "" : "text-green-700 font-semibold"
  }`;

  return (
    <a
      href={savantUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      className="flex items-center gap-2 border-b border-slate-200 px-2 hover:bg-slate-50"
      key={player.id}
    >
      <div className="w-48">
        <span className={nameClasses}>{player.fullName}</span>
        <span className="text-xs text-slate-500 ml-1">{Math.round(points)} pts</span>
      </div>
      <div className="flex-1 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical horizontal={false} />
            <Line type="monotone" dataKey="pts" stroke="#2563eb" strokeWidth={2} dot={false} />
            <XAxis dataKey="week" hide />
            <YAxis
              type="number"
              domain={[0, globalMax || 1]}
              ticks={[0, globalMax || 1]}
              tick={{ fontSize: 10 }}
              width={30}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </a>
  );
};

export default React.memo(PlayerRow); 