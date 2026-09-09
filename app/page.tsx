import { Container } from "@/src/infrastructure/config/container";
import { PlayerList } from "@/src/presentation/players/PlayerList";

// The MLB API responses underneath are cached for an hour; re-render on that cadence.
export const revalidate = 3600;

export default async function Home() {
  const service = Container.getInstance().getPlayerPointsService();
  const season = await service.resolveCurrentSeason();
  const players = await service.listPlayers(season);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Players</h1>
      <p className="mt-1 mb-6 text-slate-600">
        Yahoo fantasy points for every MLB player this regular season. Pick a
        player to see their week-by-week scoring and past seasons.
      </p>
      <PlayerList players={players} season={season} />
    </main>
  );
}
