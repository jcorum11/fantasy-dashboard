import { useEffect, useState } from "react";
import { PlayerWeekly } from "./types";

function inferCurrentSeason(date = new Date()): number {
  const yr = date.getFullYear();
  return date.getMonth() + 1 <= 2 ? yr - 1 : yr;
}

export function useWeeklyPoints(seasonParam?: number) {
  const season = seasonParam ?? inferCurrentSeason();

  const [players, setPlayers] = useState<PlayerWeekly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastWeekIdx, setLastWeekIdx] = useState(-1);
  const [globalMax, setGlobalMax] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`/api/weekly-points?season=${season}`);
        if (!res.ok) throw new Error("Request failed");
        const json: PlayerWeekly[] = await res.json();
        if (!alive) return;

        const weekCount = json[0]?.weeklyPoints.length ?? 0;
        let idx = Math.max(0, weekCount - 2);
        while (idx > 0 && json.every((p) => (p.weeklyPoints[idx] ?? 0) === 0)) {
          idx -= 1;
        }

        // Sort players by their points for the most-recently-completed week so
        // the UI always renders highest-scoring players first.
        const sorted = [...json].sort(
          (a, b) => (b.weeklyPoints[idx] ?? 0) - (a.weeklyPoints[idx] ?? 0)
        );

        setPlayers(sorted);
        setLastWeekIdx(idx);
        setGlobalMax(Math.max(0, ...json.flatMap((p) => p.weeklyPoints)));
      } catch (e: any) {
        if (!alive) return;
        setError(e.message ?? "Unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [season]);

  return { players, loading, error, lastWeekIdx, globalMax, season };
} 