// MLB API Types
export interface MLBStats {
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

export interface MLBPlayer {
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

export interface MLBTeam {
  team: {
    name: string;
  };
  players: Record<string, MLBPlayer>;
}

export interface MLBBoxScore {
  teams: {
    away: MLBTeamBoxScore;
    home: MLBTeamBoxScore;
  };
}

export interface MLBTeamBoxScore {
  team: {
    id: number;
    name: string;
    link: string;
  };
  players: {
    [key: string]: MLBPlayerBoxScore;
  };
}

export interface MLBPlayerBoxScore {
  person: {
    id: number;
    fullName: string;
    link: string;
  };
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  stats?: {
    batting?: {
      gamesPlayed?: number;
      atBats?: number;
      hits?: number;
      doubles?: number;
      triples?: number;
      homeRuns?: number;
      rbi?: number;
      runs?: number;
      baseOnBalls?: number;
      strikeOuts?: number;
      stolenBases?: number;
    };
    pitching?: {
      gamesPlayed?: number;
      inningsPitched?: string;
      hits?: number;
      runs?: number;
      earnedRuns?: number;
      baseOnBalls?: number;
      strikeOuts?: number;
      homeRuns?: number;
      wins?: number;
      losses?: number;
      saves?: number;
      holds?: number;
    };
  };
}

export interface MLBScheduleResponse {
  copyright?: string;
  totalGames?: number;
  dates: Array<{
    date: string;
    totalGames: number;
    games: Array<{
      gamePk: number;
      gameType: string;
      season: string;
      gameDate: string;
      status: {
        abstractGameState: string;
        codedGameState: string;
        detailedState: string;
        statusCode: string;
        startTimeTBD: boolean;
      };
      teams: {
        away: {
          leagueRecord: {
            wins: number;
            losses: number;
            pct: string;
          };
          score: number;
          team: {
            id: number;
            name: string;
            link: string;
          };
          isWinner: boolean;
          splitSquad: boolean;
          seriesNumber: number;
        };
        home: {
          leagueRecord: {
            wins: number;
            losses: number;
            pct: string;
          };
          score: number;
          team: {
            id: number;
            name: string;
            link: string;
          };
          isWinner: boolean;
          splitSquad: boolean;
          seriesNumber: number;
        };
      };
      venue: {
        id: number;
        name: string;
        link: string;
      };
      content: {
        link: string;
      };
      isTie: boolean;
      gameNumber: number;
      publicFacing: boolean;
      doubleHeader: string;
      gamedayType: string;
      tiebreaker: string;
      calendarEventID: string;
      seasonDisplay: string;
      dayNight: string;
      scheduledInnings: number;
      gamesInSeries: number;
      seriesGameNumber: number;
      seriesDescription: string;
      recordSource: string;
      ifNecessary: string;
      ifNecessaryDescription: string;
    }>;
  }>;
}
