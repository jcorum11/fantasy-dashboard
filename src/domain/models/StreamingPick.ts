import {
  STREAMING_RESOURCES,
  StreamingResource,
} from "@/src/domain/models/StreamingResource";

export interface StreamingPickProps {
  resource: StreamingResource;
  pitcherName: string;
  gameDate: Date;
  pickDate: Date;
  mlbPlayerId?: number | null;
  team?: string | null;
  opponent?: string | null;
  isHome?: boolean | null;
  rank?: number | null;
  tier?: string | null;
  rawScore?: number | null;
}

export class StreamingPick {
  private constructor(
    private readonly _resource: StreamingResource,
    private readonly _pitcherName: string,
    private readonly _gameDate: Date,
    private readonly _pickDate: Date,
    private readonly _mlbPlayerId: number | null,
    private readonly _team: string | null,
    private readonly _opponent: string | null,
    private readonly _isHome: boolean | null,
    private readonly _rank: number | null,
    private readonly _tier: string | null,
    private readonly _rawScore: number | null
  ) {}

  public static create(props: StreamingPickProps): StreamingPick {
    if (!STREAMING_RESOURCES.includes(props.resource)) {
      throw new Error(`Unknown streaming resource: ${props.resource}`);
    }

    const pitcherName = props.pitcherName?.trim();
    if (!pitcherName) {
      throw new Error("Pitcher name cannot be empty");
    }

    if (isNaN(props.gameDate.getTime())) {
      throw new Error("Invalid game date");
    }
    if (isNaN(props.pickDate.getTime())) {
      throw new Error("Invalid pick date");
    }

    const rank = props.rank ?? null;
    if (rank !== null && (!Number.isInteger(rank) || rank < 1)) {
      throw new Error(`Rank must be a positive integer, got: ${rank}`);
    }

    return new StreamingPick(
      props.resource,
      pitcherName,
      props.gameDate,
      props.pickDate,
      props.mlbPlayerId ?? null,
      props.team ?? null,
      props.opponent ?? null,
      props.isHome ?? null,
      rank,
      props.tier ?? null,
      props.rawScore ?? null
    );
  }

  get resource(): StreamingResource {
    return this._resource;
  }
  get pitcherName(): string {
    return this._pitcherName;
  }
  get gameDate(): Date {
    return this._gameDate;
  }
  get pickDate(): Date {
    return this._pickDate;
  }
  get mlbPlayerId(): number | null {
    return this._mlbPlayerId;
  }
  get team(): string | null {
    return this._team;
  }
  get opponent(): string | null {
    return this._opponent;
  }
  get isHome(): boolean | null {
    return this._isHome;
  }
  get rank(): number | null {
    return this._rank;
  }
  get tier(): string | null {
    return this._tier;
  }
  get rawScore(): number | null {
    return this._rawScore;
  }

  public toJSON() {
    return {
      resource: this._resource,
      pitcherName: this._pitcherName,
      gameDate: this._gameDate.toISOString().split("T")[0],
      pickDate: this._pickDate.toISOString().split("T")[0],
      mlbPlayerId: this._mlbPlayerId,
      team: this._team,
      opponent: this._opponent,
      isHome: this._isHome,
      rank: this._rank,
      tier: this._tier,
      rawScore: this._rawScore,
    };
  }
}
