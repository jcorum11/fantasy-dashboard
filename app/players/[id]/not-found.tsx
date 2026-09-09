import Link from "next/link";

export default function PlayerNotFound() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Player not found</h1>
      <p className="mt-2 text-slate-600">
        No MLB player with that id has regular-season stats.
      </p>
      <Link href="/" className="mt-6 inline-block text-indigo-700 hover:underline">
        ← Back to all players
      </Link>
    </main>
  );
}
