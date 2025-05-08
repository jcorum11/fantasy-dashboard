import { NextResponse } from "next/server";
import { MLBPlayer } from "@/lib/types/mlb";
import {
  calculateBattingPoints,
  calculatePitchingPoints,
} from "@/lib/mlb/points";

// Position mapping
const POSITION_MAP: Record<string, string> = {
  "1": "Pitcher",
  "2": "Catcher",
  "3": "First Base",
  "4": "Second Base",
  "5": "Third Base",
  "6": "Shortstop",
  "7": "Outfield",
  "8": "Outfield",
  "9": "Outfield",
  "10": "Designated Hitter",
  P: "Pitcher",
  C: "Catcher",
  "1B": "First Base",
  "2B": "Second Base",
  "3B": "Third Base",
  SS: "Shortstop",
  LF: "Outfield",
  CF: "Outfield",
  RF: "Outfield",
  DH: "Designated Hitter",
  SP: "Starting Pitcher",
  RP: "Relief Pitcher",
  UTIL: "Utility",
  Unknown: "Unknown",
};

// Function to get full position name
function getFullPositionName(positionCode: string): string {
  return POSITION_MAP[positionCode] || positionCode;
}

// Function to calculate player value based on their stats
function calculatePlayerValue(player: MLBPlayer): number {
  let value = 0;

  if (player.stats.batting) {
    const batting = player.stats.batting;
    // Basic batting value calculation
    value += (batting.hits || 0) * 1;
    value += (batting.doubles || 0) * 2;
    value += (batting.triples || 0) * 3;
    value += (batting.homeRuns || 0) * 4;
    value += (batting.rbi || 0) * 1;
    value += (batting.runs || 0) * 1;
    value += (batting.stolenBases || 0) * 2;
    value += (batting.baseOnBalls || 0) * 1;
    value -= (batting.strikeOuts || 0) * 0.5;
  }

  if (player.stats.pitching) {
    const pitching = player.stats.pitching;
    // Basic pitching value calculation
    value += (pitching.wins || 0) * 5;
    value += (pitching.saves || 0) * 3;
    value += (pitching.holds || 0) * 2;
    value += (pitching.strikeOuts || 0) * 0.5;
    value -= (pitching.earnedRuns || 0) * 2;
    value -= (pitching.baseOnBalls || 0) * 0.5;
  }

  return value;
}

// Function to calculate fantasy points for a player using custom system
function calculateFantasyPoints(player: any): number {
  if (player.stats.batting) {
    return calculateBattingPoints({
      ...player.stats.batting,
      walks: player.stats.batting.walks,
      strikeouts: player.stats.batting.strikeOuts,
    });
  }
  if (player.stats.pitching) {
    return calculatePitchingPoints({
      ...player.stats.pitching,
      pitchingStrikeouts: player.stats.pitching.strikeOuts,
      hitsAllowed: player.stats.pitching.hits,
      walksIssued: player.stats.pitching.baseOnBalls,
    });
  }
  return 0;
}

export async function GET() {
  try {
    // Determine the relevant MLB season
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // MLB season typically runs from March to October
    // If we're in the off-season (November through February), use the previous year's stats
    const relevantSeason =
      currentMonth >= 11 || currentMonth <= 2 ? currentYear - 1 : currentYear;

    // Fetch both batting and pitching stats separately
    const [battingResponse, pitchingResponse] = await Promise.all([
      fetch(
        `https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=${relevantSeason}&limit=1000`
      ),
      fetch(
        `https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${relevantSeason}&limit=1000`
      ),
    ]);

    if (!battingResponse.ok || !pitchingResponse.ok) {
      throw new Error(
        `MLB API error: ${battingResponse.status} ${pitchingResponse.status}`
      );
    }

    const [battingData, pitchingData] = await Promise.all([
      battingResponse.json(),
      pitchingResponse.json(),
    ]);

    // Check if we have valid stats data
    if (
      !battingData.stats?.[0]?.splits ||
      !Array.isArray(battingData.stats[0].splits)
    ) {
      console.error("Invalid batting data structure");
      throw new Error("Invalid response format from MLB API for batting stats");
    }

    // Update the player processing section
    const players = [
      ...battingData.stats[0].splits
        .filter((stat: any) => {
          return (
            stat &&
            stat.player &&
            stat.position &&
            stat.team &&
            stat.stat &&
            stat.stat.gamesPlayed > 0
          );
        })
        .map((stat: any) => {
          const player = {
            person: {
              id: stat.player.id,
              fullName: stat.player.fullName,
            },
            position: {
              code: stat.position.code,
              name: stat.position.name,
              type: stat.position.type,
              abbreviation: stat.position.abbreviation,
            },
            team: {
              id: stat.team.id,
              name: stat.team.name,
            },
            stats: {
              batting: {
                gamesPlayed: stat.stat.gamesPlayed || 0,
                atBats: stat.stat.atBats || 0,
                runs: stat.stat.runs || 0,
                hits: stat.stat.hits || 0,
                doubles: stat.stat.doubles || 0,
                triples: stat.stat.triples || 0,
                homeRuns: stat.stat.homeRuns || 0,
                rbi: stat.stat.rbi || 0,
                stolenBases: stat.stat.stolenBases || 0,
                caughtStealing: stat.stat.caughtStealing || 0,
                walks: stat.stat.baseOnBalls || 0,
                strikeOuts: stat.stat.strikeOuts || 0,
                battingAverage: stat.stat.avg || "0.000",
                onBasePercentage: stat.stat.obp || "0.000",
                sluggingPercentage: stat.stat.slg || "0.000",
                ops: stat.stat.ops || "0.000",
              },
            },
          };

          const fantasyPoints = calculateFantasyPoints(player);
          return {
            ...player,
            fantasyPoints,
          };
        }),
      ...pitchingData.stats[0].splits
        .filter((stat: any) => {
          // Only include pitchers who are either SP or RP by the new logic
          const saves = stat.stat.saves || 0;
          const holds = stat.stat.holds || 0;
          const gamesStarted = stat.stat.gamesStarted || 0;
          return (
            stat &&
            stat.player &&
            stat.position &&
            stat.team &&
            stat.stat &&
            stat.stat.gamesPlayed > 0 &&
            (saves > 0 || holds > 0 || gamesStarted > 0)
          );
        })
        .map((stat: any) => {
          const saves = stat.stat.saves || 0;
          const holds = stat.stat.holds || 0;
          const gamesStarted = stat.stat.gamesStarted || 0;
          let abbreviation = "";
          if (gamesStarted > 0) {
            abbreviation = "SP";
          } else if (saves > 0 || holds > 0 || gamesStarted === 0) {
            abbreviation = "RP";
          }
          const player = {
            person: {
              id: stat.player.id,
              fullName: stat.player.fullName,
            },
            position: {
              code: stat.position.code,
              name: stat.position.name,
              type: stat.position.type,
              abbreviation,
            },
            team: {
              id: stat.team.id,
              name: stat.team.name,
            },
            stats: {
              pitching: {
                gamesPlayed: stat.stat.gamesPlayed || 0,
                gamesStarted: stat.stat.gamesStarted || 0,
                inningsPitched: stat.stat.inningsPitched || "0.0",
                earnedRuns: stat.stat.earnedRuns || 0,
                wins: stat.stat.wins || 0,
                losses: stat.stat.losses || 0,
                saves: stat.stat.saves || 0,
                holds: stat.stat.holds || 0,
                strikeOuts: stat.stat.strikeOuts || 0,
                hits: stat.stat.hits || 0,
                baseOnBalls: stat.stat.baseOnBalls || 0,
                era: stat.stat.era || "0.00",
                whip: stat.stat.whip || "0.00",
              },
            },
          };

          const fantasyPoints = calculateFantasyPoints(player);
          return {
            ...player,
            fantasyPoints,
          };
        }),
    ];

    if (players.length === 0) {
      return NextResponse.json(
        { message: "No player data available for the current season" },
        { status: 200 }
      );
    }

    // Sort players by fantasy points (descending)
    players.sort((a: any, b: any) => b.fantasyPoints - a.fantasyPoints);

    console.log(`Processed ${players.length} players`);
    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching top performers:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      { error: "Failed to fetch top performers" },
      { status: 500 }
    );
  }
}
