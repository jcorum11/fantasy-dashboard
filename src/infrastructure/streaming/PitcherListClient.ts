import { StreamingPick } from "@/src/domain/models/StreamingPick";

const WP_POSTS_URL =
  "https://pitcherlist.com/wp-json/wp/v2/posts?categories=233&per_page=1";

// 24pt spans wrap the day titles; the title text sits inside further inline
// tags (<strong>), so capture the span body and strip tags before matching.
const DAY_HEADER_RE =
  /<span style="[^"]*font-size: 24pt[^"]*"[^>]*>(.*?)<\/span>/gs;
const DAY_TITLE_RE = /^\w+day\s+(\d{1,2})\/(\d{1,2}).*Streamer Rankings/;
// Tier headers (20pt spans) and pick paragraphs (<p><strong>…</strong>)
// interleave within a day section; walk them in document order.
const SECTION_ELEMENT_RE =
  /<span style="[^"]*font-size: 20pt[^"]*"[^>]*>(.*?)<\/span>|<p><strong>(.*?)<\/strong>/gs;
const MATCHUP_RE = /^(.+?)\s*(vs\.|@)\s*([A-Z]{2,4})\b/;

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/[‘’]/g, "'") // curly apostrophes → ASCII for MLB name matching
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}

interface DaySection {
  gameDate: Date;
  html: string;
}

function splitDaySections(contentHtml: string, postDate: Date): DaySection[] {
  const headers = [...contentHtml.matchAll(DAY_HEADER_RE)]
    .map((match) => ({ match, title: stripTags(match[1]).match(DAY_TITLE_RE) }))
    .filter((h) => h.title !== null);

  if (headers.length === 0) {
    throw new Error(
      "Pitcher List article has no day headers — markup drift?"
    );
  }

  const year = postDate.getUTCFullYear();
  return headers.map(({ match, title }, i) => {
    const month = String(title![1]).padStart(2, "0");
    const day = String(title![2]).padStart(2, "0");
    const start = match.index! + match[0].length;
    const end =
      i + 1 < headers.length ? headers[i + 1].match.index! : undefined;
    return {
      gameDate: new Date(`${year}-${month}-${day}T00:00:00Z`),
      html: contentHtml.slice(start, end),
    };
  });
}

export function parsePitcherListArticle(
  contentHtml: string,
  postDate: Date
): StreamingPick[] {
  const picks: StreamingPick[] = [];

  for (const section of splitDaySections(contentHtml, postDate)) {
    let tier: string | null = null;
    let rank = 0;
    const seen = new Set<string>();

    for (const element of section.html.matchAll(SECTION_ELEMENT_RE)) {
      const [, tierHtml, strongHtml] = element;

      if (tierHtml !== undefined) {
        tier = stripTags(tierHtml) || null;
        continue;
      }

      const matchup = stripTags(strongHtml).match(MATCHUP_RE);
      if (!matchup) continue; // legend entries, notes — not picks

      const [, pitcherName, separator, opponent] = matchup;
      if (seen.has(pitcherName)) {
        throw new Error(
          `Pitcher List lists ${pitcherName} twice on ` +
            `${section.gameDate.toISOString().split("T")[0]} — doubleheader?`
        );
      }
      seen.add(pitcherName);

      picks.push(
        StreamingPick.create({
          resource: "pitcherlist",
          pitcherName,
          gameDate: section.gameDate,
          pickDate: postDate,
          opponent,
          isHome: separator === "vs.",
          rank: ++rank,
          tier,
        })
      );
    }
  }

  if (picks.length === 0) {
    throw new Error("Pitcher List article parsed no picks — markup drift?");
  }

  return picks;
}

export class PitcherListClient {
  public async fetchPicks(): Promise<StreamingPick[]> {
    const res = await fetch(WP_POSTS_URL);
    if (!res.ok) {
      throw new Error(`Pitcher List request failed: ${res.status}`);
    }

    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error("Pitcher List returned no posts in category 233");
    }

    const post = posts[0];
    const postDate = new Date(`${post.date.split("T")[0]}T00:00:00Z`);
    return parsePitcherListArticle(post.content.rendered, postDate);
  }
}
