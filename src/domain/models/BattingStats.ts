export class BattingStats {
  private constructor(
    private readonly _atBats: number,
    private readonly _hits: number,
    private readonly _homeRuns: number,
    private readonly _rbi: number,
    private readonly _runs: number,
    private readonly _stolenBases: number,
    private readonly _strikeouts: number,
    private readonly _walks: number
  ) {}

  public static create(
    atBats: number,
    hits: number,
    homeRuns: number,
    rbi: number,
    runs: number,
    stolenBases: number,
    strikeouts: number,
    walks: number
  ): BattingStats {
    if (
      atBats < 0 ||
      hits < 0 ||
      homeRuns < 0 ||
      rbi < 0 ||
      runs < 0 ||
      stolenBases < 0 ||
      strikeouts < 0 ||
      walks < 0
    ) {
      throw new Error("Stats cannot be negative");
    }
    if (hits > atBats) {
      throw new Error("Hits cannot exceed at bats");
    }
    return new BattingStats(
      atBats,
      hits,
      homeRuns,
      rbi,
      runs,
      stolenBases,
      strikeouts,
      walks
    );
  }

  // Getters
  get atBats(): number {
    return this._atBats;
  }
  get hits(): number {
    return this._hits;
  }
  get homeRuns(): number {
    return this._homeRuns;
  }
  get rbi(): number {
    return this._rbi;
  }
  get runs(): number {
    return this._runs;
  }
  get stolenBases(): number {
    return this._stolenBases;
  }
  get strikeouts(): number {
    return this._strikeouts;
  }
  get walks(): number {
    return this._walks;
  }

  // Methods
  public toJSON() {
    return {
      atBats: this._atBats,
      hits: this._hits,
      homeRuns: this._homeRuns,
      rbi: this._rbi,
      runs: this._runs,
      stolenBases: this._stolenBases,
      strikeouts: this._strikeouts,
      walks: this._walks,
    };
  }
}
