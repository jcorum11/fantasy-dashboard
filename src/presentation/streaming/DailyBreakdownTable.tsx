"use client";

import {
  DailyBreakdown,
  PitcherDay,
  ResourceCall,
} from "@/src/application/services/DailyBreakdownService";
import { STREAMING_RESOURCES } from "@/src/domain/models/StreamingResource";
import {
  formatAvg,
  RESOURCE_LABELS,
} from "@/src/presentation/streaming/formatting";

export interface DailyBreakdownTableProps {
  breakdown: DailyBreakdown;
}

function VerdictBadge({ verdict }: { verdict: ResourceCall["verdict"] }) {
  if (verdict === "win") {
    return (
      <span
        aria-label="win"
        className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700"
      >
        W
      </span>
    );
  }
  if (verdict === "loss") {
    return (
      <span
        aria-label="loss"
        className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700"
      >
        L
      </span>
    );
  }
  return null;
}

function CallCell({ call }: { call: ResourceCall | undefined }) {
  if (!call) {
    return <td className="px-4 py-2 text-center text-slate-400">—</td>;
  }
  return (
    <td className="px-4 py-2 text-center">
      <span className="text-sm text-slate-700">
        {call.tier ?? (call.rank !== null ? `#${call.rank}` : "—")}
      </span>
      <VerdictBadge verdict={call.verdict} />
    </td>
  );
}

function pointsCell(pitcher: PitcherDay) {
  if (pitcher.status === "scored") {
    return (
      <span className="font-semibold text-slate-900">
        {formatAvg(pitcher.actualPoints)}
      </span>
    );
  }
  return (
    <span className="text-xs italic text-slate-400">
      {pitcher.status === "pending" ? "pending" : "no start"}
    </span>
  );
}

export function DailyBreakdownTable({ breakdown }: DailyBreakdownTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-slate-700">
        {STREAMING_RESOURCES.map((resource) => (
          <span key={resource}>
            {RESOURCE_LABELS[resource]} {breakdown.record[resource].wins}W–
            {breakdown.record[resource].losses}L
          </span>
        ))}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-sm text-slate-600">
            <th className="px-4 py-2 text-left">Pitcher</th>
            <th className="px-4 py-2 text-center">Points</th>
            {STREAMING_RESOURCES.map((resource) => (
              <th key={resource} className="px-4 py-2 text-center">
                {RESOURCE_LABELS[resource]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {breakdown.pitchers.map((pitcher) => (
            <tr
              key={pitcher.pitcherName}
              className="border-b border-slate-100"
            >
              <th scope="row" className="px-4 py-2 text-left font-medium">
                {pitcher.pitcherName}{" "}
                {pitcher.opponent && (
                  <span className="text-xs font-normal text-slate-500">
                    {pitcher.isHome ? `vs ${pitcher.opponent}` : `@ ${pitcher.opponent}`}
                  </span>
                )}
              </th>
              <td className="px-4 py-2 text-center">{pointsCell(pitcher)}</td>
              {STREAMING_RESOURCES.map((resource) => (
                <CallCell key={resource} call={pitcher.calls[resource]} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
