import { BattingStats } from "@/src/domain/models/BattingStats";
import { PitchingStats } from "@/src/domain/models/PitchingStats";

export class PlayerStats {
  private constructor(
    private readonly _id: number,
    private readonly _name: string,
    private readonly _team: string,
    private readonly _opponentTeam: string,
    private readonly _position: string,
    private readonly _points: number,
    private readonly _battingStats: BattingStats,
    private readonly _pitchingStats: PitchingStats,
    private readonly _gameDate: Date,
    private readonly _isPositionPlayerPitching: boolean
  ) {}

  public static create(
    id: number,
    name: string,
    team: string,
    opponentTeam: string,
    position: string,
    points: number,
    battingStats: BattingStats,
    pitchingStats: PitchingStats,
    gameDate: Date,
    isPositionPlayerPitching: boolean = false
  ): PlayerStats {
    if (!name || !team || !position) {
      throw new Error("Required fields cannot be empty");
    }
    return new PlayerStats(
      id,
      name,
      team,
      opponentTeam,
      position,
      points,
      battingStats,
      pitchingStats,
      gameDate,
      isPositionPlayerPitching
    );
  }

  // Getters
  get id(): number {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get team(): string {
    return this._team;
  }
  get opponentTeam(): string {
    return this._opponentTeam;
  }
  get position(): string {
    return this._position;
  }
  get points(): number {
    return this._points;
  }
  get battingStats(): BattingStats {
    return this._battingStats;
  }
  get pitchingStats(): PitchingStats {
    return this._pitchingStats;
  }
  get gameDate(): Date {
    return this._gameDate;
  }
  get isPositionPlayerPitching(): boolean {
    return this._isPositionPlayerPitching;
  }

  // Methods
  public toJSON() {
    return {
      id: this._id,
      name: this._name,
      team: this._team,
      opponentTeam: this._opponentTeam,
      position: this._position,
      points: this._points,
      battingStats: this._battingStats.toJSON(),
      pitchingStats: this._pitchingStats.toJSON(),
      gameDate: this._gameDate.toISOString().split("T")[0],
      isPositionPlayerPitching: this._isPositionPlayerPitching,
    };
  }
}
