import { afterEach, describe, expect, it, vi } from "vitest";
import { MLBClient } from "./MLBClient";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Not Found",
    json: async () => body,
  } as unknown as Response;
}

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const client = new MLBClient(() => new Date("2026-06-15T00:00:00Z"));

afterEach(() => fetchMock.mockReset());

describe("MLBClient", () => {
  it("maps a player profile with the hydrated team, and null for unknown ids", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        people: [
          {
            id: 660271,
            fullName: "Shohei Ohtani",
            active: true,
            primaryPosition: { abbreviation: "TWP" },
            currentTeam: { name: "Los Angeles Dodgers" },
          },
        ],
      })
    );
    expect(await client.getPlayer(660271)).toEqual({
      id: 660271,
      name: "Shohei Ohtani",
      position: "TWP",
      team: "Los Angeles Dodgers",
      active: true,
    });
    expect(fetchMock.mock.calls[0][0]).toContain("/people/660271?hydrate=currentTeam");

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Object not found" }, false, 404));
    expect(await client.getPlayer(1)).toBeNull();
  });

  it("maps season stat lines and requests regular-season, all-player totals", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stats: [
          {
            splits: [
              {
                player: { id: 1, fullName: "A Hitter" },
                team: { name: "Team A" },
                position: { abbreviation: "SS" },
                stat: { gamesPlayed: 10, hits: 12, homeRuns: 2, baseOnBalls: 3 },
              },
            ],
          },
        ],
      })
    );

    const lines = await client.getSeasonStatLines(2026, "hitting");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/v1/stats");
    expect(url.searchParams.get("gameType")).toBe("R");
    expect(url.searchParams.get("playerPool")).toBe("all");
    expect(url.searchParams.get("group")).toBe("hitting");
    expect(lines).toEqual([
      {
        playerId: 1,
        name: "A Hitter",
        team: "Team A",
        position: "SS",
        games: 10,
        stats: expect.objectContaining({ hits: 12, homeRuns: 2, walks: 3 }),
      },
    ]);
  });

  it("merges hitting and pitching game logs sorted by date", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stats: [
          {
            group: { displayName: "pitching" },
            splits: [{ date: "2026-04-02", game: { gamePk: 2 }, stat: { inningsPitched: "6.0", strikeOuts: 7 } }],
          },
          {
            group: { displayName: "hitting" },
            splits: [
              { date: "2026-04-01", game: { gamePk: 1 }, stat: { hits: 1 } },
              { date: "2026-04-02", game: { gamePk: 2 }, stat: { hits: 2, homeRuns: 1 } },
            ],
          },
        ],
      })
    );

    const log = await client.getGameLog(660271, 2026);

    expect(log.map((e) => [e.date, e.group])).toEqual([
      ["2026-04-01", "hitting"],
      ["2026-04-02", "pitching"],
      ["2026-04-02", "hitting"],
    ]);
    expect(log[1].gamePk).toBe(2);
    expect(log[1].stats).toMatchObject({ inningsPitched: "6.0", pitchingStrikeouts: 7 });
  });

  it("dedupes seasons across groups and traded-player splits", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stats: [
          { splits: [{ season: "2022", stat: {} }, { season: "2022", stat: {} }, { season: "2024", stat: {} }] },
          { splits: [{ season: "2021", stat: {} }, { season: "2022", stat: {} }] },
        ],
      })
    );

    expect(await client.getSeasonsPlayed(7)).toEqual([2021, 2022, 2024]);
  });

  it("returns regular-season dates and rejects seasons without them", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        seasons: [{ seasonId: "2026", regularSeasonStartDate: "2026-03-25", regularSeasonEndDate: "2026-09-27" }],
      })
    );
    expect(await client.getRegularSeasonDates(2026)).toEqual({
      start: "2026-03-25",
      end: "2026-09-27",
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({ seasons: [] }));
    await expect(client.getRegularSeasonDates(1800)).rejects.toThrow(/No regular-season dates/);
  });

  it("caches finished seasons for a week and the current one for an hour", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ stats: [] }));

    await client.getGameLog(1, 2025);
    await client.getGameLog(1, 2026);

    expect(fetchMock.mock.calls[0][1]).toEqual({ next: { revalidate: 7 * 24 * 3600 } });
    expect(fetchMock.mock.calls[1][1]).toEqual({ next: { revalidate: 3600 } });
  });

  it("throws on non-2xx responses", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 404));
    await expect(client.getGameLog(1, 2026)).rejects.toThrow(/MLB API 404/);
  });
});
