import { NextResponse } from "next/server";
import { calculateBattingPoints, calculatePitchingPoints } from "@/lib/mlb/points";

interface PlayerWeekData {
  id: number;
  fullName: string;
  teamName: string;
  positionAbbr: string;
  weeklyPoints: number[];
  totalPoints: number;
  isRostered: boolean; // NEW
}

export async function GET() {
  try {
    // Determine the relevant MLB season
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const season = currentMonth >= 11 || currentMonth <= 2 ? currentYear - 1 : currentYear;

    // Rough season start (adjust if needed)
    const seasonStart = new Date(`${season}-03-01T00:00:00Z`);

    // Build weekly windows (7-day slices)
    const weeks: { start: Date; end: Date }[] = [];
    let start = new Date(seasonStart);
    while (start <= currentDate) {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (end > currentDate) end.setTime(currentDate.getTime());
      weeks.push({ start: new Date(start), end });
      start = new Date(end);
      start.setDate(start.getDate() + 1);
    }

    // Map of playerId -> data
    const players = new Map<number, Omit<PlayerWeekData, "id" | "totalPoints"> & { totalPoints: number }>(); // isRostered managed later

    // Helper to fetch stats for a week
    async function fetchSplits(group: string, startDate: string, endDate: string): Promise<any[]> {
      const res = await fetch(`https://statsapi.mlb.com/api/v1/stats?stats=byDateRange&startDate=${startDate}&endDate=${endDate}&group=${group}&limit=1000`);
      if (!res.ok) throw new Error(`Failed fetch ${group} ${startDate}`);
      const json = await res.json();
      return json?.stats?.[0]?.splits ?? [];
    }

    // Iterate weeks
    for (let w = 0; w < weeks.length; w++) {
      const { start: startDateObj, end: endDateObj } = weeks[w];
      const startDate = startDateObj.toISOString().split("T")[0];
      const endDate = endDateObj.toISOString().split("T")[0];

      // Fetch hitting & pitching concurrently
      const [hittingSplits, pitchingSplits] = await Promise.all([
        fetchSplits("hitting", startDate, endDate),
        fetchSplits("pitching", startDate, endDate),
      ]);

      // Process batting
      hittingSplits.forEach((split: any) => {
        if (!split.player || !split.stat || split.stat.gamesPlayed === 0) return;
        const pts = calculateBattingPoints({
          ...split.stat,
          walks: split.stat.baseOnBalls,
          strikeouts: split.stat.strikeOuts,
        } as any);
        const id = split.player.id;
        if (!players.has(id)) {
          players.set(id, {
            fullName: split.player.fullName,
            teamName: split.team?.name ?? "",
            positionAbbr: split.position?.abbreviation ?? "",
            weeklyPoints: Array(weeks.length).fill(0),
            totalPoints: 0,
            isRostered: false,
          } as any);
        }
        const p = players.get(id)!;
        p.weeklyPoints[w] += pts;
        p.totalPoints += pts;
      });

      // Process pitching
      pitchingSplits.forEach((split: any) => {
        if (!split.player || !split.stat || split.stat.gamesPlayed === 0) return;
        const pts = calculatePitchingPoints({
          ...split.stat,
          pitchingStrikeouts: split.stat.strikeOuts,
          hitsAllowed: split.stat.hits,
          walksIssued: split.stat.baseOnBalls,
        } as any);
        const id = split.player.id;
        if (!players.has(id)) {
          players.set(id, {
            fullName: split.player.fullName,
            teamName: split.team?.name ?? "",
            positionAbbr: split.position?.abbreviation ?? "",
            weeklyPoints: Array(weeks.length).fill(0),
            totalPoints: 0,
            isRostered: false,
          } as any);
        }
        const p = players.get(id)!;
        p.weeklyPoints[w] += pts;
        p.totalPoints += pts;
      });
    }

    // Shape response
    const response: PlayerWeekData[] = Array.from(players.entries()).map(([id, p]) => ({
      id,
      fullName: p.fullName,
      teamName: p.teamName,
      positionAbbr: p.positionAbbr,
      weeklyPoints: p.weeklyPoints,
      totalPoints: p.totalPoints,
      isRostered: false, // placeholder, will fill later
    }));

    // Fetch rostered player names from ESPN if env vars present
    const swid = process.env.SWID;
    const espnS2 = process.env.ESPN_S2;
    const leagueId = process.env.ESPN_LEAGUE_ID;
    const seasonOverride = process.env.ESPN_SEASON ? parseInt(process.env.ESPN_SEASON, 10) : undefined;
    const segmentOverride = process.env.ESPN_SEGMENT ? parseInt(process.env.ESPN_SEGMENT, 10) : 0;
    if (swid && espnS2 && leagueId) {
      try {
        const { ESPNFantasyService } = await import("@/lib/espn/ESPNFantasyService");
        const service = new ESPNFantasyService(swid, espnS2);
        const rosterNames = await service.fetchRosteredPlayerNames(
          leagueId,
          seasonOverride ?? season,
          segmentOverride
        );
        console.log("Roster names fetched: ", rosterNames.size);
        if (rosterNames.size > 0) {
          console.log("Sample names: ", Array.from(rosterNames).slice(0, 10));
        }
        // Update roster flags
        response.forEach((player) => {
          if (rosterNames.has(player.fullName.toLowerCase())) {
            player.isRostered = true;
          }
        });
      } catch (err) {
        console.error("Failed to enrich with roster data", err);
      }
    }

    // Sort by total season points desc
    response.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Weekly points error: ", error);
    return NextResponse.json({ error: "Failed to fetch weekly points" }, { status: 500 });
  }
} 