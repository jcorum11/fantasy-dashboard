"use client";

import { useEffect, useState } from "react";
import { format, subDays, addDays, isAfter, startOfDay } from "date-fns";
import { DateNavigation } from "@/src/presentation/components/DateNavigation";
import { PlatformNavigation } from "@/src/presentation/components/PlatformNavigation";
import { ViewTypeToggle } from "@/src/presentation/components/ViewTypeToggle";
import { Platform } from "@/lib/mlb/points";
import { StatsTable } from "@/src/presentation/components/StatsTable";
import { StatsStatus } from "@/src/presentation/components/StatsStatus";
import { PlayerStatsClient } from "@/src/application/services/PlayerStatsClient";
import { PlayerStats } from "@/src/domain/models/PlayerStats";
import { getGameAvailabilityMessage } from "@/lib/mlb/dates";

const playerStatsClient = new PlayerStatsClient();

export default function Home() {
  const [viewType, setViewType] = useState<"batting" | "pitching">("batting");
  const [platform, setPlatform] = useState<Platform>("yahoo");

  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStats = async (date: Date, platform: Platform) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      // Derive which MLB season this specific date belongs to.
      const yr = date.getFullYear();
      const mo = date.getMonth() + 1; // 1-12
      const seasonForDate = mo >= 11 || mo <= 2 ? yr - 1 : yr;

      // Fetch player stats and roster info in parallel – thread season so the
      // backend can pull the correct dataset.
      const [statsResp, waiverResp] = await Promise.all([
        playerStatsClient.getPlayerStats(formattedDate, platform),
        fetch(`/api/weekly-points?season=${seasonForDate}`, {
          cache: "no-store",
        }),
      ]);

      // Handle errors from stats endpoint
      if (statsResp.error) {
        setMessage(statsResp.error);
        setStats([]);
      } else {
        const statsArray = Array.isArray(statsResp.stats)
          ? statsResp.stats
          : [];

        // Build rostered ID set based on weekly-points response
        let rosteredIds = new Set<number>();
        try {
          if (waiverResp.ok) {
            const waiverData: any[] = await waiverResp.json();
            rosteredIds = new Set(
              waiverData
                .filter((p: any) => p.isRostered)
                .map((p: any) => p.id as number)
            );
          }
        } catch {
          /* ignore roster fetch issues */
        }

        // Annotate stats with roster flag using ID lookup
        const annotatedStats = statsArray.map((p: any) => ({
          ...p,
          isRostered: rosteredIds.has(p.id),
        }));

        setStats(annotatedStats);

        // If no stats are available, show the game availability message
        if (annotatedStats.length === 0) {
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
    fetchStats(currentDate, platform);
  }, [currentDate, platform]);

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

      <div className="mb-4">
        <PlatformNavigation
          platform={platform}
          onPlatformChange={setPlatform}
        />
      </div>

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
        <>
          <p className="mb-4 text-sm text-slate-600 leading-snug">
            Names shown in{" "}
            <span className="text-green-700 font-semibold">green</span> are
            currently on our waiver wire. Click any row to open the
            corresponding player’s Baseball Savant page.
          </p>
          <StatsTable
            stats={dedupedFilteredStats}
            viewType={viewType}
            platform={platform}
          />
        </>
      )}
    </main>
  );
}
