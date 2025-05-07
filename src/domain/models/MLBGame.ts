import { MLBTeam } from "../../../lib/types/mlb";

export class MLBGame {
  private constructor(
    private readonly _gameId: number,
    private readonly _gameType: string,
    private readonly _season: string,
    private readonly _gameDate: Date,
    private readonly _status: GameStatus,
    private readonly _awayTeam: MLBTeam,
    private readonly _homeTeam: MLBTeam,
    private readonly _venue: Venue
  ) {}

  public static create(
    gameId: number,
    gameType: string,
    season: string,
    gameDate: string,
    status: GameStatus,
    awayTeam: MLBTeam,
    homeTeam: MLBTeam,
    venue: Venue
  ): MLBGame {
    return new MLBGame(
      gameId,
      gameType,
      season,
      new Date(gameDate),
      status,
      awayTeam,
      homeTeam,
      venue
    );
  }

  // Getters
  get gameId(): number {
    return this._gameId;
  }

  get gameType(): string {
    return this._gameType;
  }

  get season(): string {
    return this._season;
  }

  get gameDate(): Date {
    return this._gameDate;
  }

  get status(): GameStatus {
    return this._status;
  }

  get awayTeam(): MLBTeam {
    return this._awayTeam;
  }

  get homeTeam(): MLBTeam {
    return this._homeTeam;
  }

  get venue(): Venue {
    return this._venue;
  }

  public toJSON() {
    return {
      gameId: this._gameId,
      gameType: this._gameType,
      season: this._season,
      gameDate: this._gameDate.toISOString(),
      status: this._status,
      awayTeam: this._awayTeam,
      homeTeam: this._homeTeam,
      venue: this._venue,
    };
  }
}

export interface GameStatus {
  abstractGameState: string;
  codedGameState: string;
  detailedState: string;
  statusCode: string;
  startTimeTBD: boolean;
}

export interface Venue {
  id: number;
  name: string;
  link: string;
}
