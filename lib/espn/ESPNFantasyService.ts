export class ESPNFantasyService {
  private swid: string;
  private espnS2: string;

  constructor(swid: string, espnS2: string) {
    this.swid = swid;
    this.espnS2 = espnS2;
  }

  private buildCookie(): string {
    // ESPN cookie sometimes copied in URL-encoded form; decode to raw '+' etc.
    let s2 = this.espnS2;
    try {
      // Only decode if it contains percent escapes
      if (/%[0-9A-Fa-f]{2}/.test(s2)) {
        s2 = decodeURIComponent(s2);
      }
    } catch {
      /* ignore decode errors */
    }
    return `SWID=${this.swid}; espn_s2=${s2}`;
  }

  /**
   * Fetch the set of player full names that are currently rostered in the given league.
   * Matching is done by fullName string returned by ESPN; comparison should be case-insensitive.
   */
  public async fetchRosteredPlayerNames(
    leagueId: string,
    season: number,
    segment: number = 0
  ): Promise<Set<string>> {
    const apiHost = "https://lm-api-reads.fantasy.espn.com"; // sub-domain that delivers JSON without redirect
    const multiViews = "view=mRoster&view=mTeam&view=mSettings&view=modular&view=mNav";
    const url0 = `${apiHost}/apis/v3/games/flb/seasons/${season}/segments/${segment}/leagues/${leagueId}?${multiViews}`;

    const res = await fetch(url0, {
      headers: {
        Cookie: this.buildCookie(),
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "X-Fantasy-Source": "kona",
      },
      // ESPN returns big payload; disable next.js caching to always get fresh copy (optional)
      next: { revalidate: 60 },
    });

    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("application/json")) {
      // Attempt fallback without segment path (older API pattern)
      const fallbackUrl = `https://fantasy.espn.com/apis/v3/games/flb/seasons/${season}/segments/${segment}/leagues/${leagueId}?view=mRoster`;
      const res2 = await fetch(fallbackUrl, {
        headers: {
          Cookie: this.buildCookie(),
          Accept: "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "X-Fantasy-Source": "kona",
        },
        next: { revalidate: 60 },
      });

      if (!res2.ok || !(res2.headers.get("content-type") ?? "").includes("application/json")) {
        const first200 = await res2.text().then((t) => t.slice(0, 200));
        console.error("Both ESPN endpoints returned non-JSON. Status1:", res.status, "Status2:", res2.status, "Snippet:", first200);
        throw new Error("ESPN returned non-JSON response");
      }

      return this.extractRosterNames(await res2.json());
    }

    return this.extractRosterNames(await res.json());
  }

  private extractRosterNames(data: any): Set<string> {
    const names = new Set<string>();
    if (Array.isArray(data.teams)) {
      for (const team of data.teams) {
        const entries = team?.roster?.entries ?? [];
        for (const entry of entries) {
          const player = entry?.playerPoolEntry?.player;
          if (player?.fullName) {
            names.add((player.fullName as string).toLowerCase());
          }
        }
      }
    }

    return names;
  }
} 