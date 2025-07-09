"use client";

import { useEffect, useState } from "react";
import { format, subDays, addDays, isAfter, startOfDay } from "date-fns";
import { DateNavigation } from "@/src/presentation/components/DateNavigation";
import { ViewTypeToggle } from "@/src/presentation/components/ViewTypeToggle";
import { StatsTable } from "@/src/presentation/components/StatsTable";
import { StatsStatus } from "@/src/presentation/components/StatsStatus";
import { PlayerStatsClient } from "@/src/application/services/PlayerStatsClient";
import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { getGameAvailabilityMessage } from "@/lib/mlb/dates";

const playerStatsClient = new PlayerStatsClient();

export default function Home() {
  const [viewType, setViewType] = useState<"batting" | "pitching">("batting");
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStats = async (date: Date) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await playerStatsClient.getPlayerStats(formattedDate);

      if (response.error) {
        setMessage(response.error);
        setStats([]);
      } else {
        const statsArray = Array.isArray(response.stats) ? response.stats : [];
        setStats(statsArray);

        // If no stats are available, show the game availability message
        if (statsArray.length === 0) {
          setMessage(getGameAvailabilityMessage(formattedDate));
        }
      }
    } catch (error) {
      setMessage("Failed to fetch stats. Please try again.");
      setStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(currentDate);
  }, [currentDate]);

  const handlePreviousDay = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const canNavigateNext = isAfter(startOfDay(new Date()), currentDate);

  const filteredStats = (stats || []).filter((player) => {
    if (viewType === "batting") {
      return player.battingStats.atBats > 0;
    } else {
      return (
        player.pitchingStats.inningsPitched > 0 ||
        (player.pitchingStats.gamesStarted &&
          player.pitchingStats.gamesStarted > 0)
      );
    }
  });

  // Deduplicate filteredStats by composite key
  const dedupedFilteredStats = Array.from(
    new Map(
      filteredStats.map((player) => [
        `${player.id}-${player.team}-${player.opponentTeam}-${player.position}-${player.isPositionPlayerPitching}`,
        player,
      ])
    ).values()
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">
        MLB Player Stats
      </h1>

      {/* Replacement Level Dashboard removed */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateNavigation
          currentDate={currentDate}
          isLoading={isLoading}
          onPreviousDay={handlePreviousDay}
          onNextDay={handleNextDay}
          canNavigateNext={canNavigateNext}
        />
        <ViewTypeToggle viewType={viewType} onViewTypeChange={setViewType} />
      </div>

      <StatsStatus isLoading={isLoading} message={message} />

      {!isLoading && !message && (
        <StatsTable stats={dedupedFilteredStats} viewType={viewType} />
      )}
    </main>
  );
}
