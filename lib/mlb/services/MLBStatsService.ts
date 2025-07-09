import { MLBPlayer } from "../../types/mlb";
import { calculateBattingPoints, calculatePitchingPoints } from "../points";

export interface ProcessedPlayerStats {
  person: {
    id: number;
    fullName: string;
  };
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  team: {
    id: number;
    name: string;
  };
  stats: {
    batting?: {
      gamesPlayed: number;
      atBats: number;
      runs: number;
      hits: number;
      doubles: number;
      triples: number;
      homeRuns: number;
      rbi: number;
      stolenBases: number;
      caughtStealing: number;
      walks: number;
      strikeOuts: number;
      battingAverage: string;
      onBasePercentage: string;
      sluggingPercentage: string;
      ops: string;
    };
    pitching?: {
      gamesPlayed: number;
      gamesStarted: number;
      inningsPitched: string;
      earnedRuns: number;
      wins: number;
      losses: number;
      saves: number;
      holds: number;
      strikeOuts: number;
      hits: number;
      baseOnBalls: number;
      era: string;
      whip: string;
    };
  };
  fantasyPoints: number;
}

export class MLBStatsService {
  public async fetchSeasonStats(
    season: number
  ): Promise<ProcessedPlayerStats[]> {
    const [battingResponse, pitchingResponse] = await Promise.all([
      this.fetchBattingStats(season),
      this.fetchPitchingStats(season),
    ]);

    const battingPlayers = this.processBattingStats(battingResponse);
    const pitchingPlayers = this.processPitchingStats(pitchingResponse);

    return [...battingPlayers, ...pitchingPlayers].sort(
      (a, b) => b.fantasyPoints - a.fantasyPoints
    );
  }

  private async fetchBattingStats(season: number): Promise<any> {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=${season}&limit=1000`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch batting stats: ${response.status}`);
    }

    const data = await response.json();
    if (!data.stats?.[0]?.splits || !Array.isArray(data.stats[0].splits)) {
      throw new Error("Invalid batting stats data structure");
    }

    return data.stats[0].splits;
  }

  private async fetchPitchingStats(season: number): Promise<any> {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${season}&limit=1000`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pitching stats: ${response.status}`);
    }

    const data = await response.json();
    if (!data.stats?.[0]?.splits || !Array.isArray(data.stats[0].splits)) {
      throw new Error("Invalid pitching stats data structure");
    }

    return data.stats[0].splits;
  }

  private processBattingStats(stats: any[]): ProcessedPlayerStats[] {
    return stats
      .filter((stat) => this.isValidPlayerStat(stat))
      .map((stat) => {
        const player = this.createBattingPlayer(stat);
        if (!player.stats.batting) {
          throw new Error("Invalid batting stats");
        }
        const fantasyPoints = calculateBattingPoints({
          ...player.stats.batting,
          walks: player.stats.batting.walks,
          strikeouts: player.stats.batting.strikeOuts,
        });
        return { ...player, fantasyPoints };
      });
  }

  private processPitchingStats(stats: any[]): ProcessedPlayerStats[] {
    return stats
      .filter((stat) => this.isValidPitcherStat(stat))
      .map((stat) => {
        const player = this.createPitchingPlayer(stat);
        if (!player.stats.pitching) {
          throw new Error("Invalid pitching stats");
        }
        const fantasyPoints = calculatePitchingPoints({
          ...player.stats.pitching,
          pitchingStrikeouts: player.stats.pitching.strikeOuts,
          hitsAllowed: player.stats.pitching.hits,
          walksIssued: player.stats.pitching.baseOnBalls,
        });
        return { ...player, fantasyPoints };
      });
  }

  private isValidPlayerStat(stat: any): boolean {
    return (
      stat?.player &&
      stat?.position &&
      stat?.team &&
      stat?.stat?.gamesPlayed > 0
    );
  }

  private isValidPitcherStat(stat: any): boolean {
    const saves = stat.stat.saves || 0;
    const holds = stat.stat.holds || 0;
    const gamesStarted = stat.stat.gamesStarted || 0;
    return (
      this.isValidPlayerStat(stat) &&
      (saves > 0 || holds > 0 || gamesStarted > 0)
    );
  }

  private createBattingPlayer(stat: any): ProcessedPlayerStats {
    return {
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
      fantasyPoints: 0,
    };
  }

  private createPitchingPlayer(stat: any): ProcessedPlayerStats {
    const saves = stat.stat.saves || 0;
    const holds = stat.stat.holds || 0;
    const gamesStarted = stat.stat.gamesStarted || 0;
    let abbreviation = "";

    if (gamesStarted > 0) {
      abbreviation = "SP";
    } else if (saves > 0 || holds > 0 || gamesStarted === 0) {
      abbreviation = "RP";
    }

    return {
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
      fantasyPoints: 0,
    };
  }
}
