"use client";

import {
  RankBucket,
  ResourceComparison,
  SegmentStats,
} from "@/src/application/services/StreamingComparisonService";
import {
  formatAvg,
  formatHitRate,
  RESOURCE_LABELS,
} from "@/src/presentation/streaming/formatting";

export interface StreamingResourcesProps {
  resources: ResourceComparison[];
}

const BUCKET_ROWS: { bucket: RankBucket; label: string }[] = [
  { bucket: "high", label: "High" },
  { bucket: "mid", label: "Mid" },
  { bucket: "low", label: "Low" },
];

function Cell({ stats }: { stats: SegmentStats | undefined }) {
  if (!stats || stats.scored === 0) {
    return <td className="px-4 py-2 text-center text-slate-400">—</td>;
  }
  return (
    <td className="px-4 py-2 text-center">
      <span className="font-semibold text-slate-900">
        {formatAvg(stats.avgPoints)}
      </span>{" "}
      <span className="text-sm text-slate-600">
        · {formatHitRate(stats.hitRate)} hit
      </span>{" "}
      <span className="text-xs text-slate-500">(n={stats.scored})</span>
    </td>
  );
}

export function ComparisonGrid({ resources }: StreamingResourcesProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-slate-200 text-sm text-slate-600">
          <th className="px-4 py-2 text-left">Segment</th>
          {resources.map((r) => (
            <th key={r.resource} className="px-4 py-2 text-center">
              {RESOURCE_LABELS[r.resource]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-slate-100">
          <th scope="row" className="px-4 py-2 text-left font-medium">
            Overall
          </th>
          {resources.map((r) => (
            <Cell key={r.resource} stats={r.overall} />
          ))}
        </tr>
        {BUCKET_ROWS.map(({ bucket, label }) => (
          <tr key={bucket} className="border-b border-slate-100">
            <th scope="row" className="px-4 py-2 text-left font-medium">
              {label}
            </th>
            {resources.map((r) => (
              <Cell
                key={r.resource}
                stats={r.byBucket.find((b) => b.bucket === bucket)}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
