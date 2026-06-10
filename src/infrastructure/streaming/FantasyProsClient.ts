import { StreamingPick } from "@/src/domain/models/StreamingPick";
import { decodeEntities, stripTags } from "@/src/infrastructure/streaming/htmlText";

const PAGE_URL = "https://www.fantasypros.com/mlb/streaming-pitchers.php";
// Default agents get bot-filtered; a desktop browser UA returns the page.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DAY_TABLE_RE =
  /<table class="table table--sticky-columns table-condensed">(.*?)<\/table>/gs;
// The <caption> shows the LAST day of the range on every table — the
// date-subhead <h2> inside the table is the authoritative day.
const DATE_SUBHEAD_RE =
  /class="date-subhead[^"]*"[^>]*>\s*<h2[^>]*>([^<]+)<\/h2>/;
// Live markup quirk: the player-label <td> is malformed (unclosed attribute,
// `…report-page"<td>`), so rows are parsed cell-wise with a tolerant regex
// and the pitcher name comes from the fp-player-name attribute instead.
const PLAYER_ROW_RE = /<tr class="mpb-player-[^"]*"[^>]*>(.*?)<\/tr>/gs;
const PLAYER_NAME_RE = /fp-player-name="([^"]+)"/;
const CELL_RE = /<td[^>]*>(.*?)<\/td>/gs;
const MATCHUP_RE = /class="matchup"[^>]*>\s*(@?)([A-Z]{2,4})\s*</;

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseDaySubhead(heading: string, pickDate: Date): Date {
  const match = heading.match(/(\w+)\s+(\d{1,2})/u);
  const month = match && MONTHS[match[1].toLowerCase()];
  if (!match || !month) {
    throw new Error(`FantasyPros day heading not understood: "${heading}"`);
  }
  const year = pickDate.getUTCFullYear();
  const mm = String(month).padStart(2, "0");
  const dd = String(match[2]).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T00:00:00Z`);
}

export function parseFantasyProsPage(
  html: string,
  pickDate: Date
): StreamingPick[] {
  const picks: StreamingPick[] = [];
  let dayTables = 0;

  for (const table of html.matchAll(DAY_TABLE_RE)) {
    const subhead = table[1].match(DATE_SUBHEAD_RE);
    if (!subhead) continue;
    dayTables++;

    const gameDate = parseDaySubhead(stripTags(subhead[1]), pickDate);
    const seen = new Set<string>();

    for (const row of table[1].matchAll(PLAYER_ROW_RE)) {
      const rowHtml = row[1];

      const nameAttr = rowHtml.match(PLAYER_NAME_RE);
      if (!nameAttr) continue;
      const pitcherName = decodeEntities(nameAttr[1]).trim();

      const cells = [...rowHtml.matchAll(CELL_RE)].map((c) =>
        stripTags(c[1])
      );
      const vbr = cells[0];
      if (!/^\d+$/.test(vbr ?? "")) continue; // unranked ("—") rows

      if (seen.has(pitcherName)) {
        throw new Error(
          `FantasyPros lists ${pitcherName} twice on ` +
            `${gameDate.toISOString().split("T")[0]} — doubleheader?`
        );
      }
      seen.add(pitcherName);

      const matchup = rowHtml.match(MATCHUP_RE);

      picks.push(
        StreamingPick.create({
          resource: "fantasypros",
          pitcherName,
          gameDate,
          pickDate,
          team: cells[2] || null,
          opponent: matchup ? matchup[2] : null,
          isHome: matchup ? matchup[1] !== "@" : null,
          rank: Number(vbr),
        })
      );
    }
  }

  if (dayTables === 0) {
    throw new Error("FantasyPros page has no day tables — markup drift?");
  }
  if (picks.length === 0) {
    throw new Error("FantasyPros page parsed no picks — markup drift?");
  }

  return picks;
}

export class FantasyProsClient {
  public async fetchPicks(pickDate: Date): Promise<StreamingPick[]> {
    const res = await fetch(PAGE_URL, {
      headers: { "User-Agent": BROWSER_UA },
    });
    if (!res.ok) {
      throw new Error(`FantasyPros request failed: ${res.status}`);
    }

    return parseFantasyProsPage(await res.text(), pickDate);
  }
}
