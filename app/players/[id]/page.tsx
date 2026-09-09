import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/src/infrastructure/config/container";
import { parsePositiveInt } from "@/src/presentation/api/params";
import { SeasonWeeklyChart } from "@/src/presentation/players/SeasonWeeklyChart";

export const revalidate = 3600;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parsePositiveInt(params.id);
  const player = id ? await Container.getInstance().getPlayerPointsService().getPlayer(id) : null;
  return { title: player ? `${player.name} · Weekly points` : "Player not found" };
}

export default async function PlayerPage({ params }: Props) {
  const id = parsePositiveInt(params.id);
  if (id === null) notFound();

  const service = Container.getInstance().getPlayerPointsService();
  const [player, seasons] = await Promise.all([
    service.getPlayer(id),
    service.getSeasonsPlayed(id),
  ]);
  if (!player || seasons.length === 0) notFound();

  // Default to the most recent season the player actually appeared in.
  const latest = seasons[seasons.length - 1];
  const initial = await service.getSeasonWeeklyPoints(id, latest);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-indigo-700 hover:underline">
        ← All players
      </Link>
      <header className="mt-2 mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{player.name}</h1>
        <p className="text-slate-600">
          {player.position}
          {player.team ? ` · ${player.team}` : ""}
        </p>
      </header>
      <SeasonWeeklyChart playerId={id} seasons={[...seasons].reverse()} initial={initial} />
    </main>
  );
}
