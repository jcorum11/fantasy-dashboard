import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DailyWaiversClient,
  parseDailyWaiversRecords,
} from "@/src/infrastructure/streaming/DailyWaiversClient";
import {
  errorResponse,
  jsonResponse,
  makeRecord,
} from "@/src/infrastructure/streaming/DailyWaiversClient.mocks";

// Assumed contract (drives the implementation):
//   parseDailyWaiversRecords(records, pickDate) -> StreamingPick[]
//   new DailyWaiversClient().fetchPicks(startDate, endDate, pickDate)
//     -> Promise<StreamingPick[]>
//
// Contract decisions pinned below (adjust if you disagree):
//   - Rank is derived per game_date partition: dwScore DESC, ties broken by
//     pitcher name ASC (deterministic, so re-ingest upserts are idempotent).
//   - Records with null/missing dwScore are kept (rawScore null) and ranked
//     AFTER all scored records within their game_date.
//   - A record with no player name THROWS — corrupt payloads surface to the
//     ingest route's per-client error handling, never silently dropped.
//   - fetchPicks throws on a non-ok response, naming the resource and status.

const PICK_DATE = new Date("2026-06-10T00:00:00Z");

describe("parseDailyWaiversRecords", () => {
  it("maps a record to a StreamingPick with dwScore as rawScore", () => {
    const picks = parseDailyWaiversRecords([makeRecord()], PICK_DATE);

    expect(picks).toHaveLength(1);
    const pick = picks[0];
    expect(pick.resource).toBe("dailywaivers");
    expect(pick.pitcherName).toBe("Michael King");
    expect(pick.team).toBe("SDP");
    expect(pick.opponent).toBe("CIN");
    expect(pick.isHome).toBe(true);
    expect(pick.rawScore).toBe(60);
    expect(pick.tier).toBeNull();
    expect(pick.mlbPlayerId).toBeNull();
    expect(pick.gameDate.toISOString()).toBe("2026-06-10T00:00:00.000Z");
    expect(pick.pickDate).toBe(PICK_DATE);
  });

  it("ranks by dwScore descending within a game date", () => {
    const picks = parseDailyWaiversRecords(
      [
        makeRecord({ name: "Jake Bennett", dwScore: 35 }),
        makeRecord({ name: "Michael King", dwScore: 60 }),
        makeRecord({ name: "Brady Singer", dwScore: 49 }),
      ],
      PICK_DATE
    );

    const byName = Object.fromEntries(picks.map((p) => [p.pitcherName, p.rank]));
    expect(byName).toEqual({
      "Michael King": 1,
      "Brady Singer": 2,
      "Jake Bennett": 3,
    });
  });

  it("breaks dwScore ties by pitcher name ascending", () => {
    const picks = parseDailyWaiversRecords(
      [
        makeRecord({ name: "Zack Wheeler", dwScore: 50 }),
        makeRecord({ name: "Aaron Nola", dwScore: 50 }),
      ],
      PICK_DATE
    );

    const byName = Object.fromEntries(picks.map((p) => [p.pitcherName, p.rank]));
    expect(byName).toEqual({ "Aaron Nola": 1, "Zack Wheeler": 2 });
  });

  it("ranks each game date independently for multi-day ranges", () => {
    const picks = parseDailyWaiversRecords(
      [
        makeRecord({ name: "Michael King", game_date: "2026-06-10", dwScore: 60 }),
        makeRecord({ name: "Brady Singer", game_date: "2026-06-10", dwScore: 49 }),
        makeRecord({ name: "Robbie Ray", game_date: "2026-06-11", dwScore: 39 }),
      ],
      PICK_DATE
    );

    const ray = picks.find((p) => p.pitcherName === "Robbie Ray")!;
    expect(ray.rank).toBe(1);
    expect(ray.gameDate.toISOString()).toBe("2026-06-11T00:00:00.000Z");
  });

  it("keeps records without a dwScore, ranked after all scored records", () => {
    const picks = parseDailyWaiversRecords(
      [
        makeRecord({ name: "Mystery Arm", dwScore: null }),
        makeRecord({ name: "Jake Bennett", dwScore: 35 }),
        makeRecord({ name: "Michael King", dwScore: 60 }),
      ],
      PICK_DATE
    );

    const mystery = picks.find((p) => p.pitcherName === "Mystery Arm")!;
    expect(mystery.rawScore).toBeNull();
    expect(mystery.rank).toBe(3);
  });

  it("throws when a pitcher appears twice on one game date — doubleheader guard", () => {
    expect(() =>
      parseDailyWaiversRecords(
        [
          makeRecord({ name: "Michael King", dwScore: 60 }),
          makeRecord({ name: "Michael King", dwScore: 55 }),
        ],
        PICK_DATE
      )
    ).toThrow(/twice|duplicate/i);
  });

  it("throws when EVERY record is scoreless — dwScore field rename/drift guard", () => {
    expect(() =>
      parseDailyWaiversRecords(
        [
          makeRecord({ name: "Michael King", dwScore: null }),
          makeRecord({ name: "Brady Singer", dwScore: undefined }),
        ],
        PICK_DATE
      )
    ).toThrow(/dwScore/);
  });

  it("throws when a record has no player name", () => {
    expect(() =>
      parseDailyWaiversRecords([makeRecord({ name: "" })], PICK_DATE)
    ).toThrow(/pitcher name/i);
  });

  it("returns an empty array for an empty response", () => {
    expect(parseDailyWaiversRecords([], PICK_DATE)).toEqual([]);
  });
});

describe("DailyWaiversClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchPicks", () => {
    it("requests the probables endpoint with YYYY-MM-DD date params", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([makeRecord()]));

      await new DailyWaiversClient().fetchPicks(
        new Date("2026-06-10T00:00:00Z"),
        new Date("2026-06-11T00:00:00Z"),
        PICK_DATE
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = String(fetchMock.mock.calls[0][0]);
      expect(url).toContain("dailywaivers.com/api/players/probables");
      expect(url).toContain("startDate=2026-06-10");
      expect(url).toContain("endDate=2026-06-11");
      expect(url).toContain("showRanks=true");
    });

    it("returns parsed StreamingPicks", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse([
          makeRecord({ name: "Michael King", dwScore: 60 }),
          makeRecord({ name: "Brady Singer", dwScore: 49 }),
        ])
      );

      const picks = await new DailyWaiversClient().fetchPicks(
        new Date("2026-06-10T00:00:00Z"),
        new Date("2026-06-10T00:00:00Z"),
        PICK_DATE
      );

      expect(picks.map((p) => [p.pitcherName, p.rank])).toEqual([
        ["Michael King", 1],
        ["Brady Singer", 2],
      ]);
    });

    it("retries 5xx responses and throws after exhausting attempts", async () => {
      fetchMock.mockResolvedValue(errorResponse(503));

      await expect(
        new DailyWaiversClient({ retries: 3, delayMs: 0 }).fetchPicks(
          PICK_DATE,
          PICK_DATE,
          PICK_DATE
        )
      ).rejects.toThrow(/DailyWaivers.*503/i);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("does not retry 4xx responses", async () => {
      fetchMock.mockResolvedValue(errorResponse(403));

      await expect(
        new DailyWaiversClient({ retries: 3, delayMs: 0 }).fetchPicks(
          PICK_DATE,
          PICK_DATE,
          PICK_DATE
        )
      ).rejects.toThrow(/DailyWaivers.*403/i);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
