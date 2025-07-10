import { NextResponse } from "next/server";
import { calculateBattingPoints, calculatePitchingPoints } from "@/lib/mlb/points";

export const dynamic = "force-dynamic";

interface PlayerWeekData {
  id: number;
  fullName: string;
  teamName: string;
  positionAbbr: string;
  weeklyPoints: number[];
  totalPoints: number;
  isRostered: boolean; // NEW
}

export async function GET(req: Request) {
  try {
    // --------------------------------------------------------------------
    // 1. Parse query-params
    //    • ?season=YYYY → forces which MLB season to use
    //    • ?endDate=YYYY-MM-DD → forces the *latest* date to include when
    //      building ISO-week ranges (useful when the host clock is behind)
    // --------------------------------------------------------------------
    const url = new URL(req.url);

    const seasonParam = url.searchParams.get("season");
    const endDateParam = url.searchParams.get("endDate");

    // Pick the base "today" date first so everything consistently derives
    // from this value.
    let currentDate = endDateParam ? new Date(endDateParam) : new Date();

    // If the caller asked for a *future* season (e.g., 2025 while the host
    // machine is still on 2024) and they did NOT also specify an explicit
    // endDate, bump the year component forward so that we actually include
    // games from that season up to the same month/day.
    if (!endDateParam && seasonParam) {
      const forcedSeason = parseInt(seasonParam, 10);
      if (
        !Number.isNaN(forcedSeason) &&
        forcedSeason > currentDate.getFullYear()
      ) {
        const m = currentDate.getMonth();
        // Preserve local time-zone components.
        currentDate = new Date(currentDate);
        currentDate.setFullYear(forcedSeason);
        // Handle 29 Feb → 28 Feb in non-leap years, etc.
        if (currentDate.getMonth() !== m) {
          currentDate.setDate(0); // roll back to last day previous month
        }
      }
    }

    // Now that currentDate is final, derive the season if one wasn't forced
    // explicitly. "Season" runs roughly March-Oct, so Nov–Feb belong to the
    // *following* calendar year.
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const inferredSeason =
      currentMonth >= 11 || currentMonth <= 2 ? currentYear - 1 : currentYear;

    const season = seasonParam ? parseInt(seasonParam, 10) : inferredSeason;

    // Rough season start (adjust if needed)
    const seasonStart = new Date(`${season}-03-01T00:00:00Z`);

    // Align to ISO week (Monday - Sunday)
    const firstMonday = new Date(seasonStart);
    while (firstMonday.getUTCDay() !== 1) {
      // getUTCDay: 0=Sun,1=Mon,... Adjust back to Monday
      firstMonday.setUTCDate(firstMonday.getUTCDate() - 1);
    }

    // Build ISO weekly windows
    const weeks: { start: Date; end: Date }[] = [];
    let start = new Date(firstMonday);
    while (start <= currentDate) {
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      if (end > currentDate) end.setTime(currentDate.getTime());
      weeks.push({ start: new Date(start), end });
      start = new Date(end);
      start.setUTCDate(start.getUTCDate() + 1);
    }

    // Map of playerId -> data
    const players = new Map<
      number,
      Omit<PlayerWeekData, "id" | "totalPoints"> & { totalPoints: number }
    >(); // isRostered managed later

    // Helper to fetch stats for a week
    async function fetchSplits(
      group: string,
      startDate: string,
      endDate: string,
      season: number
    ): Promise<any[]> {
      const res = await fetch(
        `https://statsapi.mlb.com/api/v1/stats?stats=byDateRange&startDate=${startDate}&endDate=${endDate}&group=${group}&season=${season}&limit=5000`
      );
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
        fetchSplits("hitting", startDate, endDate, season),
        fetchSplits("pitching", startDate, endDate, season),
      ]);

      // Process batting
      hittingSplits.forEach((split: any) => {
        if (!split.player || !split.stat || split.stat.gamesPlayed === 0)
          return;
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
        if (!split.player || !split.stat || split.stat.gamesPlayed === 0)
          return;
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
    const response: PlayerWeekData[] = Array.from(players.entries()).map(
      ([id, p]) => ({
        id,
        fullName: p.fullName,
        teamName: p.teamName,
        positionAbbr: p.positionAbbr,
        weeklyPoints: p.weeklyPoints,
        totalPoints: p.totalPoints,
        isRostered: false, // placeholder, will fill later
      })
    );

    // Fetch rostered player names from ESPN if env vars present
    const swid = process.env.SWID;
    const espnS2 = process.env.ESPN_S2;
    const leagueId = process.env.ESPN_LEAGUE_ID;
    const seasonOverride = process.env.ESPN_SEASON
      ? parseInt(process.env.ESPN_SEASON, 10)
      : undefined;
    const segmentOverride = process.env.ESPN_SEGMENT
      ? parseInt(process.env.ESPN_SEGMENT, 10)
      : 0;
    if (swid && espnS2 && leagueId) {
      try {
        const { ESPNFantasyService } = await import(
          "@/lib/espn/ESPNFantasyService"
        );
        const service = new ESPNFantasyService(swid, espnS2);
        const rawRosterNames = await service.fetchRosteredPlayerNames(
          leagueId,
          seasonOverride ?? season,
          segmentOverride
        );
        // Helper to normalize names (remove diacritics, lowercase)
        const normalize = (str: string) =>
          str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const rosterNames = new Set<string>();
        rawRosterNames.forEach((n) => rosterNames.add(normalize(n)));

        // Update roster flags using normalized comparison
        response.forEach((player) => {
          if (rosterNames.has(normalize(player.fullName))) {
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
    return NextResponse.json(
      { error: "Failed to fetch weekly points" },
      { status: 500 }
    );
  }
} 