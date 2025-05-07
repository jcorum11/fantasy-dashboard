export class PitchingStats {
  private constructor(
    private readonly _inningsPitched: number,
    private readonly _earnedRuns: number,
    private readonly _pitchingStrikeouts: number,
    private readonly _hitsAllowed: number,
    private readonly _walksIssued: number,
    private readonly _wins: number,
    private readonly _losses: number,
    private readonly _saves: number,
    private readonly _holds: number | null,
    private readonly _gamesStarted: number
  ) {}

  public static create(
    inningsPitched: number,
    earnedRuns: number,
    pitchingStrikeouts: number,
    hitsAllowed: number,
    walksIssued: number,
    wins: number,
    losses: number,
    saves: number,
    holds: number | null,
    gamesStarted: number
  ): PitchingStats {
    if (
      inningsPitched < 0 ||
      earnedRuns < 0 ||
      pitchingStrikeouts < 0 ||
      hitsAllowed < 0 ||
      walksIssued < 0 ||
      wins < 0 ||
      losses < 0 ||
      saves < 0 ||
      gamesStarted < 0
    ) {
      throw new Error("Stats cannot be negative");
    }
    if (holds !== null && holds < 0) {
      throw new Error("Holds cannot be negative");
    }
    return new PitchingStats(
      inningsPitched,
      earnedRuns,
      pitchingStrikeouts,
      hitsAllowed,
      walksIssued,
      wins,
      losses,
      saves,
      holds,
      gamesStarted
    );
  }

  // Getters
  get inningsPitched(): number {
    return this._inningsPitched;
  }
  get earnedRuns(): number {
    return this._earnedRuns;
  }
  get pitchingStrikeouts(): number {
    return this._pitchingStrikeouts;
  }
  get hitsAllowed(): number {
    return this._hitsAllowed;
  }
  get walksIssued(): number {
    return this._walksIssued;
  }
  get wins(): number {
    return this._wins;
  }
  get losses(): number {
    return this._losses;
  }
  get saves(): number {
    return this._saves;
  }
  get holds(): number | null {
    return this._holds;
  }
  get gamesStarted(): number {
    return this._gamesStarted;
  }

  // Methods
  public toJSON() {
    return {
      inningsPitched: this._inningsPitched,
      earnedRuns: this._earnedRuns,
      pitchingStrikeouts: this._pitchingStrikeouts,
      hitsAllowed: this._hitsAllowed,
      walksIssued: this._walksIssued,
      wins: this._wins,
      losses: this._losses,
      saves: this._saves,
      holds: this._holds,
      gamesStarted: this._gamesStarted,
    };
  }
}
