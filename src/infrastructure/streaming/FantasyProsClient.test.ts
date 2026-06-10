import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { StreamingPick } from "@/src/domain/models/StreamingPick";
import {
  FantasyProsClient,
  parseFantasyProsPage,
} from "@/src/infrastructure/streaming/FantasyProsClient";
import {
  errorResponse,
  htmlResponse,
  PAGE_HTML,
} from "@/src/infrastructure/streaming/FantasyProsClient.mocks";

// Assumed contract (drives the implementation):
//   parseFantasyProsPage(html, pickDate) -> StreamingPick[]
//   new FantasyProsClient().fetchPicks(pickDate) -> Promise<StreamingPick[]>
//
// Contract decisions pinned below (adjust if you disagree):
//   - One table--sticky-columns table per day; the day comes from the
//     date-subhead <h2> ("Wednesday, June 10th"), year from pickDate.
//     The table <caption> is WRONG on the live site (always shows the last
//     day) and must be ignored.
//   - Rank = the VBR cell value, NOT row order. rawScore stays null.
//   - Pitcher name from the fp-player-name attribute (drift-resistant, and
//     the player-label <td> is malformed on the live site).
//   - Opp "@PIT" => away vs PIT; bare "BOS" => home vs BOS.
//   - Guards: same pitcher twice in one day-table throws (doubleheader);
//     no day tables throws; tables-but-zero-picks throws. A single empty
//     day-table is fine while other days have picks.

const PICK_DATE = new Date("2026-06-10T00:00:00Z");

describe("parseFantasyProsPage", () => {
  let picks: StreamingPick[];

  beforeAll(() => {
    picks = parseFantasyProsPage(PAGE_HTML, PICK_DATE);
  });

  it("parses player rows across day tables with VBR as rank", () => {
    expect(
      picks.map((p) => [
        p.pitcherName,
        p.gameDate.toISOString().split("T")[0],
        p.rank,
      ])
    ).toEqual([
      ["Shohei Ohtani", "2026-06-10", 1],
      ["Logan O'Hoppe Sr.", "2026-06-10", 2],
      ["Edward Cabrera", "2026-06-11", 1],
    ]);
  });

  it("survives the malformed player-label cell and decodes entity names", () => {
    // "Logan O&#8217;Hoppe Sr." -> ASCII apostrophe for MLB name matching
    const ohoppe = picks.find((p) => p.pitcherName === "Logan O'Hoppe Sr.")!;
    expect(ohoppe).toBeDefined();
    expect(ohoppe.team).toBe("TBR");
  });

  it("maps @OPP to away and bare OPP to home", () => {
    const ohtani = picks.find((p) => p.pitcherName === "Shohei Ohtani")!;
    expect(ohtani.opponent).toBe("PIT");
    expect(ohtani.isHome).toBe(false);

    const ohoppe = picks.find((p) => p.pitcherName === "Logan O'Hoppe Sr.")!;
    expect(ohoppe.opponent).toBe("BOS");
    expect(ohoppe.isHome).toBe(true);
  });

  it("sets resource fields: fantasypros, pickDate through, null tier/score/mlbPlayerId", () => {
    const ohtani = picks.find((p) => p.pitcherName === "Shohei Ohtani")!;
    expect(ohtani.resource).toBe("fantasypros");
    expect(ohtani.pickDate).toBe(PICK_DATE);
    expect(ohtani.team).toBe("LAD");
    expect(ohtani.tier).toBeNull();
    expect(ohtani.rawScore).toBeNull();
    expect(ohtani.mlbPlayerId).toBeNull();
  });

  it("allows an empty day table while other days have picks", () => {
    const friday = picks.filter(
      (p) => p.gameDate.toISOString() === "2026-06-12T00:00:00.000Z"
    );
    expect(friday).toEqual([]);
  });

  it("ignores the (wrong) table captions when resolving dates", () => {
    // every caption says June 16th; no pick may resolve to it
    expect(
      picks.some((p) => p.gameDate.toISOString().startsWith("2026-06-16"))
    ).toBe(false);
  });

  it("throws when a pitcher appears twice on one game date — doubleheader guard", () => {
    const doubled = PAGE_HTML.replace(
      'fp-player-name="Logan O&#8217;Hoppe Sr."',
      'fp-player-name="Shohei Ohtani"'
    );
    expect(() => parseFantasyProsPage(doubled, PICK_DATE)).toThrow(
      /twice|duplicate/i
    );
  });

  it("throws when no day tables are present — markup drift guard", () => {
    expect(() =>
      parseFantasyProsPage("<html><body>redesign</body></html>", PICK_DATE)
    ).toThrow(/day table/i);
  });

  it("throws when day tables exist but zero picks parse — markup drift guard", () => {
    const emptyOnly = `
<table class="table table--sticky-columns table-condensed"><tbody>
<tr><th colspan="15" class="date-subhead"><h2>Friday, June 12th</h2></th></tr>
</tbody></table>`;
    expect(() => parseFantasyProsPage(emptyOnly, PICK_DATE)).toThrow(
      /no picks/i
    );
  });
});

describe("FantasyProsClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchPicks", () => {
    it("requests streaming-pitchers.php with a browser User-Agent", async () => {
      fetchMock.mockResolvedValueOnce(htmlResponse(PAGE_HTML));

      await new FantasyProsClient().fetchPicks(PICK_DATE);

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain(
        "fantasypros.com/mlb/streaming-pitchers.php"
      );
      expect(init?.headers?.["User-Agent"]).toMatch(/Mozilla/);
    });

    it("returns parsed picks", async () => {
      fetchMock.mockResolvedValueOnce(htmlResponse(PAGE_HTML));

      const picks = await new FantasyProsClient().fetchPicks(PICK_DATE);

      expect(picks).toHaveLength(3);
      expect(picks[0].resource).toBe("fantasypros");
    });

    it("does not retry a Cloudflare 403", async () => {
      fetchMock.mockResolvedValue(errorResponse(403));

      await expect(
        new FantasyProsClient({ retries: 3, delayMs: 0 }).fetchPicks(PICK_DATE)
      ).rejects.toThrow(/FantasyPros.*403/i);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries 5xx responses and throws after exhausting attempts", async () => {
      fetchMock.mockResolvedValue(errorResponse(502));

      await expect(
        new FantasyProsClient({ retries: 3, delayMs: 0 }).fetchPicks(PICK_DATE)
      ).rejects.toThrow(/FantasyPros.*502/i);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
