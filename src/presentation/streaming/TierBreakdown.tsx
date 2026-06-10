"use client";

import {
  formatAvg,
  formatHitRate,
  RESOURCE_LABELS,
} from "@/src/presentation/streaming/formatting";
import { StreamingResourcesProps } from "@/src/presentation/streaming/ComparisonGrid";

export function TierBreakdown({ resources }: StreamingResourcesProps) {
  const tiered = resources.filter((r) => r.byTier.length > 0);
  if (tiered.length === 0) return null;

  return (
    <>
      {tiered.map((resource) => (
        <div key={resource.resource}>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            {RESOURCE_LABELS[resource.resource]} tiers
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-600">
                <th className="px-4 py-2 text-left">Tier</th>
                <th className="px-4 py-2 text-center">Avg points</th>
              </tr>
            </thead>
            <tbody>
              {resource.byTier.map((tier) => (
                <tr key={tier.tier} className="border-b border-slate-100">
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    {tier.tier}
                  </th>
                  <td className="px-4 py-2 text-center">
                    <span className="font-semibold text-slate-900">
                      {formatAvg(tier.avgPoints)}
                    </span>{" "}
                    <span className="text-sm text-slate-600">
                      · {formatHitRate(tier.hitRate)} hit
                    </span>{" "}
                    <span className="text-xs text-slate-500">
                      (n={tier.scored})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
