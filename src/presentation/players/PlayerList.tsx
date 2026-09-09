"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlayerSummary } from "@/src/domain/models/PlayerSummary";

interface Props {
  players: PlayerSummary[];
  season: number;
}

/** Searchable, points-ranked list of every player with a stat line this season. */
export function PlayerList({ players, season }: Props) {
  const [query, setQuery] = useState("");

  const ranked = useMemo(
    () => players.map((p, i) => ({ ...p, rank: i + 1 })),
    [players]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.position.toLowerCase() === q
    );
  }, [ranked, query]);

  return (
    <section>
      <label className="block">
        <span className="sr-only">Search players</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, team, or position…"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </label>

      <p className="mt-2 text-sm text-slate-500" aria-live="polite">
        {visible.length === players.length
          ? `${players.length.toLocaleString()} players · ${season} regular season`
          : `${visible.length.toLocaleString()} of ${players.length.toLocaleString()} players`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-slate-500">
          No players match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 text-right">#</th>
                <th scope="col" className="px-4 py-2">Player</th>
                <th scope="col" className="px-4 py-2">Team</th>
                <th scope="col" className="px-4 py-2">Pos</th>
                <th scope="col" className="px-4 py-2 text-right">G</th>
                <th scope="col" className="px-4 py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{p.rank}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/players/${p.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.team}</td>
                  <td className="px-4 py-2 text-slate-600">{p.position}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{p.games}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">
                    {p.points.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
