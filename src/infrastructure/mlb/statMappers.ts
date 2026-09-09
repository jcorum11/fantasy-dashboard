import { MLBStats } from "@/lib/types/mlb";
import { StatGroup } from "@/src/domain/interfaces/IMLBClient";

/**
 * Raw `stat` object from the MLB Stats API. Field names are shared between
 * hitting and pitching groups but mean different things (a pitcher's `hits`
 * are hits allowed, `strikeOuts` are strikeouts thrown), so mapping is per
 * group. Every field is optional; the API returns null for stats that don't
 * apply to the group.
 */
export interface RawStat {
  gamesPlayed?: number | null;
  hits?: number | null;
  doubles?: number | null;
  triples?: number | null;
  homeRuns?: number | null;
  rbi?: number | null;
  runs?: number | null;
  stolenBases?: number | null;
  baseOnBalls?: number | null;
  hitByPitch?: number | null;
  inningsPitched?: string | null;
  earnedRuns?: number | null;
  wins?: number | null;
  saves?: number | null;
  strikeOuts?: number | null;
  hitBatsmen?: number | null;
}

const count = (value: number | null | undefined): number => value ?? 0;

export function mapHittingStat(raw: RawStat): MLBStats {
  return {
    hits: count(raw.hits),
    doubles: count(raw.doubles),
    triples: count(raw.triples),
    homeRuns: count(raw.homeRuns),
    rbi: count(raw.rbi),
    runs: count(raw.runs),
    stolenBases: count(raw.stolenBases),
    walks: count(raw.baseOnBalls),
    hitByPitch: count(raw.hitByPitch),
  };
}

export function mapPitchingStat(raw: RawStat): MLBStats {
  return {
    inningsPitched: raw.inningsPitched ?? "0.0",
    earnedRuns: count(raw.earnedRuns),
    wins: count(raw.wins),
    saves: count(raw.saves),
    pitchingStrikeouts: count(raw.strikeOuts),
    hitsAllowed: count(raw.hits),
    walksIssued: count(raw.baseOnBalls),
    hitBatters: count(raw.hitBatsmen),
  };
}

export function mapStat(group: StatGroup, raw: RawStat): MLBStats {
  return group === "hitting" ? mapHittingStat(raw) : mapPitchingStat(raw);
}
