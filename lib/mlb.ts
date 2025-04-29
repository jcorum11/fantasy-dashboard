import axios from "axios";
import { format } from "date-fns";
import { PlayerStats } from "./db";

const MLB_STATS_API = "https://statsapi.mlb.com/api/v1";

// Fantasy points scoring system
const POINTS_SYSTEM = {
  // Batting
  totalBases: 1,
  walks: 1,
  runsScored: 1,
  rbis: 1,
  stolenBases: 1,
  strikeouts: -1,

  // Pitching
  inningsPitched: 3,
  earnedRuns: -2,
  wins: 2,
  losses: -2,
  saves: 5,
  pitchingStrikeouts: 1,
  hitsAllowed: -1,
  walksIssued: -1,
  holds: 2,
};

interface MLBStats {
  // Batting stats
  atBats?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  runs?: number;
  stolenBases?: number;
  walks?: number;
  strikeouts?: number;

  // Pitching stats
  inningsPitched?: string;
  earnedRuns?: number;
  wins?: number;
  losses?: number;
  saves?: number;
  pitchingStrikeouts?: number;
  hitsAllowed?: number;
  walksIssued?: number;
  holds?: number;
}

interface MLBPlayer {
  person: {
    id: number;
    fullName: string;
  };
  position: {
    abbreviation: string;
  };
  stats: {
    batting: {
      gamesPlayed?: number;
      atBats?: number;
      hits?: number;
      doubles?: number;
      triples?: number;
      homeRuns?: number;
      rbi?: number;
      runs?: number;
      stolenBases?: number;
      baseOnBalls?: number;
      strikeOuts?: number;
    };
    pitching: {
      gamesPlayed?: number;
      inningsPitched?: string;
      earnedRuns?: number;
      wins?: number;
      losses?: number;
      saves?: number;
      strikeOuts?: number;
      hits?: number;
      baseOnBalls?: number;
      holds?: number;
    };
  };
}

interface MLBTeam {
  team: {
    name: string;
  };
  players: Record<string, MLBPlayer>;
}

interface MLBBoxScore {
  teams: {
    away: MLBTeam;
    home: MLBTeam;
  };
}

export async function getGamesByDate(date: string) {
  try {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    console.error("=== MLB: Getting Games ===");
    console.error("Date:", formattedDate);

    const response = await axios.get(`${MLB_STATS_API}/schedule`, {
      params: {
        sportId: 1,
        date: formattedDate,
        hydrate: "team,stats,probablePitcher(note)",
        fields:
          "dates,dates.games,dates.games.gamePk,dates.games.status,dates.games.teams,dates.games.venue",
      },
    });

    console.error("=== MLB API Schedule Response ===");
    console.error(JSON.stringify(response.data, null, 2));

    const games = response.data.dates[0]?.games || [];
    console.error("Games found:", games.length);

    if (games.length === 0) {
      console.error(
        "MLB API Response:",
        JSON.stringify(response.data, null, 2)
      );
    }

    return games;
  } catch (error) {
    console.error("=== MLB: Error Getting Games ===");
    console.error("Error details:", error);
    throw error;
  }
}

export async function getGameBoxScore(gameId: number): Promise<MLBBoxScore> {
  try {
    console.error(`=== MLB: Getting Boxscore for Game ${gameId} ===`);
    const response = await axios.get(
      `${MLB_STATS_API}/game/${gameId}/boxscore`,
      {
        params: {
          fields:
            "teams,teams.team,teams.players,teams.players.stats,teams.players.person,teams.players.position",
        },
      }
    );
    console.error("=== MLB API Boxscore Response ===");
    const boxscore = response.data as MLBBoxScore;
    console.error("Teams:", Object.keys(boxscore.teams).join(", "));

    // Count total players
    let totalPlayers = 0;
    Object.values(boxscore.teams).forEach((team) => {
      totalPlayers += Object.keys(team.players || {}).length;
    });
    console.error("Players found:", totalPlayers);

    // Log sample player stats
    const teams = Object.values(boxscore.teams);
    if (teams.length > 0) {
      const firstTeam = teams[0];
      const players = Object.values(firstTeam.players);
      if (players.length > 0) {
        const player = players[0];
        console.error("Sample player stats:", {
          name: player.person.fullName,
          position: player.position.abbreviation,
          stats: player.stats,
        });
      }
    }

    console.error("Boxscore retrieved successfully");
    return boxscore;
  } catch (error) {
    console.error(`=== MLB: Error Getting Boxscore for Game ${gameId} ===`);
    console.error("Error details:", error);
    throw error;
  }
}

function calculateBattingPoints(stats: MLBStats): number {
  // Calculate total bases (singles = 1, doubles = 2, triples = 3, home runs = 4)
  const singles = Math.max(
    0,
    (stats.hits || 0) -
      ((stats.doubles || 0) + (stats.triples || 0) + (stats.homeRuns || 0))
  );
  const totalBases =
    singles +
    (stats.doubles || 0) * 2 +
    (stats.triples || 0) * 3 +
    (stats.homeRuns || 0) * 4;

  return (
    totalBases * POINTS_SYSTEM.totalBases +
    (stats.walks || 0) * POINTS_SYSTEM.walks +
    (stats.runs || 0) * POINTS_SYSTEM.runsScored +
    (stats.rbi || 0) * POINTS_SYSTEM.rbis +
    (stats.stolenBases || 0) * POINTS_SYSTEM.stolenBases +
    (stats.strikeouts || 0) * POINTS_SYSTEM.strikeouts
  );
}

function calculatePitchingPoints(stats: MLBStats): number {
  let points = 0;

  if (stats.inningsPitched) {
    points += parseFloat(stats.inningsPitched) * POINTS_SYSTEM.inningsPitched;
  }

  points += (stats.earnedRuns || 0) * POINTS_SYSTEM.earnedRuns;
  points += (stats.wins || 0) * POINTS_SYSTEM.wins;
  points += (stats.losses || 0) * POINTS_SYSTEM.losses;
  points += (stats.saves || 0) * POINTS_SYSTEM.saves;
  points += (stats.pitchingStrikeouts || 0) * POINTS_SYSTEM.pitchingStrikeouts;
  points += (stats.hitsAllowed || 0) * POINTS_SYSTEM.hitsAllowed;
  points += (stats.walksIssued || 0) * POINTS_SYSTEM.walksIssued;
  points += (stats.holds || 0) * POINTS_SYSTEM.holds;

  return points;
}

export async function getPlayerStatsByDate(
  date: string
): Promise<PlayerStats[]> {
  try {
    console.error("=== MLB: Getting Player Stats ===");
    const games = await getGamesByDate(date);
    const playerStats: PlayerStats[] = [];

    for (const game of games) {
      const boxscore = await getGameBoxScore(game.gamePk);
      console.error(`Processing game: ${game.gamePk}`);
      console.error(
        `Teams: ${boxscore.teams.away.team.name} vs ${boxscore.teams.home.team.name}`
      );

      // Process both teams
      ["away", "home"].forEach((teamType) => {
        const team = boxscore.teams[teamType as keyof typeof boxscore.teams];
        const players = Object.values(team.players);
        console.error(
          `Processing ${players.length} players for ${team.team.name}`
        );

        // Process each player
        players.forEach((player) => {
          let points = 0;
          let battingStats = {
            atBats: 0,
            hits: 0,
            homeRuns: 0,
            rbi: 0,
            runs: 0,
            stolenBases: 0,
            strikeouts: 0,
            walks: 0,
          };

          let pitchingStats = {
            inningsPitched: 0,
            earnedRuns: 0,
            pitchingStrikeouts: 0,
            hitsAllowed: 0,
            walksIssued: 0,
            wins: 0,
            losses: 0,
            saves: 0,
            holds: 0,
          };

          if (player.stats?.batting?.gamesPlayed) {
            console.error(
              `Processing batting stats for: ${player.person.fullName}`
            );
            const stats: MLBStats = {
              atBats: player.stats.batting.atBats,
              hits: player.stats.batting.hits,
              doubles: player.stats.batting.doubles,
              triples: player.stats.batting.triples,
              homeRuns: player.stats.batting.homeRuns,
              rbi: player.stats.batting.rbi,
              runs: player.stats.batting.runs,
              stolenBases: player.stats.batting.stolenBases,
              strikeouts: player.stats.batting.strikeOuts,
              walks: player.stats.batting.baseOnBalls,
            };
            points += calculateBattingPoints(stats);
            battingStats = {
              atBats: stats.atBats || 0,
              hits: stats.hits || 0,
              homeRuns: stats.homeRuns || 0,
              rbi: stats.rbi || 0,
              runs: stats.runs || 0,
              stolenBases: stats.stolenBases || 0,
              strikeouts: stats.strikeouts || 0,
              walks: stats.walks || 0,
            };
          }

          if (player.stats?.pitching?.gamesPlayed) {
            console.error(
              `Processing pitching stats for: ${player.person.fullName}`
            );
            console.error(
              `Raw pitching stats:`,
              JSON.stringify(player.stats.pitching, null, 2)
            );
            const stats: MLBStats = {
              inningsPitched: player.stats.pitching.inningsPitched,
              earnedRuns: player.stats.pitching.earnedRuns,
              pitchingStrikeouts: player.stats.pitching.strikeOuts,
              hitsAllowed: player.stats.pitching.hits,
              walksIssued: player.stats.pitching.baseOnBalls,
              wins: player.stats.pitching.wins,
              losses: player.stats.pitching.losses,
              saves: player.stats.pitching.saves,
              holds: player.stats.pitching.holds,
            };
            console.error(`Processed holds value: ${stats.holds}`);
            points += calculatePitchingPoints(stats);
            pitchingStats = {
              inningsPitched: stats.inningsPitched
                ? parseFloat(stats.inningsPitched)
                : 0,
              earnedRuns: stats.earnedRuns || 0,
              pitchingStrikeouts: stats.pitchingStrikeouts || 0,
              hitsAllowed: stats.hitsAllowed || 0,
              walksIssued: stats.walksIssued || 0,
              wins: stats.wins || 0,
              losses: stats.losses || 0,
              saves: stats.saves || 0,
              holds: stats.holds || 0,
            };
          }

          playerStats.push({
            id: player.person.id,
            name: player.person.fullName,
            team: team.team.name,
            position: player.position.abbreviation,
            points,
            battingStats,
            pitchingStats,
            gameDate: date,
          });
        });
      });
    }

    console.error(`Total players processed: ${playerStats.length}`);
    return playerStats;
  } catch (error) {
    console.error("=== MLB: Error Getting Player Stats ===");
    console.error("Error details:", error);
    throw error;
  }
}
