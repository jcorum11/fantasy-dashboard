import { beforeEach, describe, expect, it } from "vitest";
import { PlayerPointsService } from "./PlayerPointsService";
import { FakeMLBClient, hitterLine, pitcherLine } from "./PlayerPointsService.mocks";

let mlb: FakeMLBClient;
let service: PlayerPointsService;

beforeEach(() => {
  mlb = new FakeMLBClient();
  service = new PlayerPointsService(mlb, () => new Date("2026-06-15T00:00:00Z"));
});

describe("PlayerPointsService.resolveCurrentSeason", () => {
  it("uses the calendar year once it has stat lines", async () => {
    mlb.seasonLines["2026:hitting"] = [hitterLine()];
    expect(await service.resolveCurrentSeason()).toBe(2026);
  });

  it("falls back to last season before opening day", async () => {
    expect(await service.resolveCurrentSeason()).toBe(2025);
  });
});

describe("PlayerPointsService.listPlayers", () => {
  it("scores hitters and pitchers with Yahoo points and sorts best first", async () => {
    mlb.seasonLines["2026:hitting"] = [hitterLine()];
    mlb.seasonLines["2026:pitching"] = [pitcherLine()];

    const players = await service.listPlayers(2026);

    expect(players.map((p) => [p.name, p.points])).toEqual([
      ["Slugger One", 104],
      ["Ace Two", 60],
    ]);
    expect(players[0]).toMatchObject({ id: 1, team: "Team A", position: "1B", games: 50 });
  });

  it("merges a two-way player into one row keeping the hitting position", async () => {
    mlb.seasonLines["2026:hitting"] = [hitterLine({ playerId: 9, name: "Two Way", position: "DH", games: 100 })];
    mlb.seasonLines["2026:pitching"] = [pitcherLine({ playerId: 9, name: "Two Way", games: 20 })];

    const players = await service.listPlayers(2026);

    expect(players).toEqual([
      { id: 9, name: "Two Way", team: "Team A", position: "DH", points: 164, games: 100 },
    ]);
  });

  it("breaks point ties alphabetically and rounds to cents", async () => {
    mlb.seasonLines["2026:hitting"] = [
      hitterLine({ playerId: 1, name: "Zed", stats: { hits: 3 } }), // 3 singles = 7.8000000000000007
      hitterLine({ playerId: 2, name: "Amy", stats: { hits: 3 } }),
    ];

    const players = await service.listPlayers(2026);

    expect(players.map((p) => p.name)).toEqual(["Amy", "Zed"]);
    expect(players[0].points).toBe(7.8);
  });

  it("returns an empty list for a season with no lines", async () => {
    expect(await service.listPlayers(1999)).toEqual([]);
  });
});

describe("PlayerPointsService.getSeasonWeeklyPoints", () => {
  beforeEach(() => {
    // Wed 2026-03-25 .. Sun 2026-04-12 => weeks starting Mon 03-23, 03-30, 04-06
    mlb.seasonDates[2026] = { start: "2026-03-25", end: "2026-04-12" };
  });

  it("buckets game points into Monday–Sunday weeks, including empty weeks", async () => {
    mlb.gameLogs["1:2026"] = [
      { date: "2026-03-25", gamePk: 1, group: "hitting", stats: { homeRuns: 1, hits: 1 } }, // 10.4
      { date: "2026-03-29", gamePk: 2, group: "hitting", stats: { hits: 1 } }, // 2.6 (Sunday, still week 1)
      { date: "2026-04-07", gamePk: 3, group: "hitting", stats: { runs: 1 } }, // 1.9 (week 3)
    ];

    const result = await service.getSeasonWeeklyPoints(1, 2026);

    expect(result.weeks).toEqual([
      { week: 1, start: "2026-03-23", end: "2026-03-29", points: 13, games: 2 },
      { week: 2, start: "2026-03-30", end: "2026-04-05", points: 0, games: 0 },
      { week: 3, start: "2026-04-06", end: "2026-04-12", points: 1.9, games: 1 },
    ]);
    expect(result).toMatchObject({ playerId: 1, season: 2026, totalPoints: 14.9, games: 3 });
  });

  it("counts a two-way player's game once but a doubleheader twice", async () => {
    mlb.gameLogs["9:2026"] = [
      { date: "2026-03-25", gamePk: 1, group: "hitting", stats: { hits: 1 } }, // 2.6
      { date: "2026-03-25", gamePk: 1, group: "pitching", stats: { inningsPitched: "1.0" } }, // 3
      { date: "2026-03-26", gamePk: 2, group: "hitting", stats: {} },
      { date: "2026-03-26", gamePk: 3, group: "hitting", stats: {} },
    ];

    const { weeks } = await service.getSeasonWeeklyPoints(9, 2026);

    expect(weeks[0]).toMatchObject({ points: 5.6, games: 3 });
  });

  it("ignores games outside the regular-season weeks", async () => {
    mlb.gameLogs["1:2026"] = [
      { date: "2026-03-01", gamePk: 1, group: "hitting", stats: { homeRuns: 1, hits: 1 } },
    ];

    const result = await service.getSeasonWeeklyPoints(1, 2026);

    expect(result.totalPoints).toBe(0);
    expect(result.games).toBe(0);
  });

  it("propagates missing season dates", async () => {
    await expect(service.getSeasonWeeklyPoints(1, 1800)).rejects.toThrow(/1800/);
  });
});
