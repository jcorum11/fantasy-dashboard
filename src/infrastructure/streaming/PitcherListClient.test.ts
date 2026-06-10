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
  parsePitcherListArticle,
  PitcherListClient,
} from "@/src/infrastructure/streaming/PitcherListClient";
import {
  ARTICLE_HTML,
  ARTICLE_POST_DATE,
  errorResponse,
  jsonResponse,
  makeWpPost,
} from "@/src/infrastructure/streaming/PitcherListClient.mocks";

// Assumed contract (drives the implementation):
//   parsePitcherListArticle(contentHtml, postDate) -> StreamingPick[]
//   new PitcherListClient().fetchPicks() -> Promise<StreamingPick[]>
//     (latest post in WP category 233; pickDate = the post's publish date)
//
// Contract decisions pinned below (adjust if you disagree):
//   - Day sections split on 24pt "<Weekday> M/D Starting Pitcher Streamer
//     Rankings" header spans; game year comes from the post date.
//   - Tier = the 20pt section header as written (e.g. "Auto-Starts"). The
//     singular-name legend at the top has no font-size and is ignored, as is
//     any pre-day-header content ("My Pick today: ...").
//   - Rank = 1-based order of appearance across the WHOLE day (spans tiers,
//     Do Not Starts included — they're anti-pick signal, tier records it).
//   - Pick name comes from the <strong> text before the vs./@ separator —
//     NEVER from player-tag anchors in the commentary (the "Twins Bullpen
//     (Opener)" case). "vs." => home, "@" => away. Team is not in the markup.
//   - Drift guards: no day headers found -> throw; day headers but zero
//     picks in the whole article -> throw. A single gated day with no picks
//     is fine (Friday is gated for free users).

const POST_DATE = new Date("2026-06-10T00:00:00Z");

describe("parsePitcherListArticle", () => {
  let picks: StreamingPick[];

  beforeAll(() => {
    picks = parsePitcherListArticle(ARTICLE_HTML, POST_DATE);
  });

  it("extracts picks with tier and whole-day ordinal rank", () => {
    const wednesday = picks.filter(
      (p) => p.gameDate.toISOString() === "2026-06-10T00:00:00.000Z"
    );

    expect(
      wednesday.map((p) => [p.pitcherName, p.tier, p.rank])
    ).toEqual([
      ["Shohei Ohtani", "Auto-Starts", 1],
      ["Drew Rasmussen", "Auto-Starts", 2],
      ["Carlos Rodón", "Probably Starts", 3],
      ["Twins Bullpen (Opener)", "Questionable Starts", 4],
      ["Ryan Feltner", "Do Not Starts", 5],
    ]);
  });

  it("maps vs. to home and @ to away with the opponent abbreviation", () => {
    const ohtani = picks.find((p) => p.pitcherName === "Shohei Ohtani")!;
    expect(ohtani.isHome).toBe(false);
    expect(ohtani.opponent).toBe("PIT");

    const rasmussen = picks.find((p) => p.pitcherName === "Drew Rasmussen")!;
    expect(rasmussen.isHome).toBe(true);
    expect(rasmussen.opponent).toBe("BOS");
  });

  it("resolves game dates from day headers using the post date's year", () => {
    const woo = picks.find((p) => p.pitcherName === "Bryan Woo")!;
    expect(woo.gameDate.toISOString()).toBe("2026-06-11T00:00:00.000Z");
    expect(woo.tier).toBe("Auto-Starts");
    expect(woo.rank).toBe(1);
  });

  it("sets resource fields: pickDate from post, null team/score/mlbPlayerId", () => {
    const ohtani = picks.find((p) => p.pitcherName === "Shohei Ohtani")!;
    expect(ohtani.resource).toBe("pitcherlist");
    expect(ohtani.pickDate).toBe(POST_DATE);
    expect(ohtani.team).toBeNull();
    expect(ohtani.rawScore).toBeNull();
    expect(ohtani.mlbPlayerId).toBeNull();
  });

  it("does not parse the legend, pre-day 'My Pick' anchors, or DataTable rows", () => {
    const names = picks.map((p) => p.pitcherName);
    expect(names).not.toContain("Ignore Me");
    expect(names).not.toContain("Table Pitcher Must Not Parse");
    expect(names).not.toContain("Auto-Start");
    expect(names).not.toContain("Mike Someone"); // commentary anchor
  });

  it("yields no picks for a gated day without failing the article", () => {
    const friday = picks.filter(
      (p) => p.gameDate.toISOString() === "2026-06-12T00:00:00.000Z"
    );
    expect(friday).toEqual([]);
  });

  it("decodes HTML entities in pitcher names", () => {
    const obrien = picks.find((p) => p.pitcherName === "Patrick O'Brien")!;
    expect(obrien).toBeDefined();
    expect(obrien.gameDate.toISOString()).toBe("2026-06-11T00:00:00.000Z");
  });

  it("throws when a pitcher appears twice on one game date — doubleheader guard", () => {
    const doubled = `
<p style="text-align: center;"><span style="font-size: 24pt; color: #333399;">Wednesday 6/10 Starting Pitcher Streamer Rankings</span></p>
<p><span style="color: #3366ff; font-size: 20pt;">Auto-Starts</span></p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/shohei-ohtani/">Shohei Ohtani</a> @ PIT &#8211; </strong>Game one.</p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/shohei-ohtani/">Shohei Ohtani</a> @ PIT &#8211; </strong>Game two.</p>`;
    expect(() => parsePitcherListArticle(doubled, POST_DATE)).toThrow(
      /twice|duplicate/i
    );
  });

  it("throws when no day headers are present — markup drift guard", () => {
    expect(() =>
      parsePitcherListArticle("<p>some unrelated post</p>", POST_DATE)
    ).toThrow(/day header/i);
  });

  it("throws when day headers exist but zero picks parse — markup drift guard", () => {
    const headerOnly =
      '<p><span style="font-size: 24pt; color: #333399;">Wednesday 6/10 Starting Pitcher Streamer Rankings</span></p>';
    expect(() => parsePitcherListArticle(headerOnly, POST_DATE)).toThrow(
      /no picks/i
    );
  });
});

describe("PitcherListClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchPicks", () => {
    it("requests the latest post from WP category 233", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([makeWpPost()]));

      await new PitcherListClient().fetchPicks();

      const url = String(fetchMock.mock.calls[0][0]);
      expect(url).toContain("pitcherlist.com/wp-json/wp/v2/posts");
      expect(url).toContain("categories=233");
      expect(url).toContain("per_page=1");
    });

    it("returns parsed picks with pickDate taken from the post's publish date", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([makeWpPost()]));

      const picks = await new PitcherListClient().fetchPicks();

      expect(picks.length).toBeGreaterThan(0);
      expect(picks[0].pickDate.toISOString()).toBe(
        "2026-06-10T00:00:00.000Z"
      );
      expect(ARTICLE_POST_DATE.startsWith("2026-06-10")).toBe(true);
    });

    it("throws a resource-named error on a non-ok response", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(503));

      await expect(new PitcherListClient().fetchPicks()).rejects.toThrow(
        /Pitcher List.*503/i
      );
    });

    it("throws when the category has no posts", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([]));

      await expect(new PitcherListClient().fetchPicks()).rejects.toThrow(
        /no.*post/i
      );
    });
  });
});
