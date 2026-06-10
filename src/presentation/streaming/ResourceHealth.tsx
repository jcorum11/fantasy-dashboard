"use client";

import { ResourceComparison } from "@/src/application/services/StreamingComparisonService";
import { RESOURCE_LABELS } from "@/src/presentation/streaming/formatting";
import { StreamingResourcesProps } from "@/src/presentation/streaming/ComparisonGrid";

function chip(resource: ResourceComparison): {
  text: string;
  className: string;
} {
  const label = RESOURCE_LABELS[resource.resource];
  const { successDays, failedDays } = resource.coverage;

  if (failedDays > 0) {
    return {
      text: `${label}: ${failedDays} failed ingest day${failedDays === 1 ? "" : "s"} (${successDays} ok)`,
      className: "bg-amber-100 text-amber-800 border-amber-300",
    };
  }
  if (resource.overall.picks === 0) {
    return {
      text: `${label}: no data in this range`,
      className: "bg-slate-100 text-slate-500 border-slate-200",
    };
  }
  return {
    text: `${label}: ${successDays} ingest day${successDays === 1 ? "" : "s"} ok`,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

export function ResourceHealth({ resources }: StreamingResourcesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {resources.map((resource) => {
        const { text, className } = chip(resource);
        return (
          <span
            key={resource.resource}
            role="status"
            className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
