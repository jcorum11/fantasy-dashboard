const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";
const PAGE_SIZE = 25; // Yahoo returns at most 25 players per page

/**
 * Exchange a long-lived refresh token for a fresh access token.
 * Throws if Yahoo rejects the request.
 */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  // Yahoo expects the redirect_uri registered with the app; deployments set
  // YAHOO_REDIRECT_URI to their own callback URL.
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (redirectUri) params.set("redirect_uri", redirectUri);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: params,
  });

  if (!res.ok) {
    throw new Error(`Yahoo token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * Reads rostered ("taken") players from a Yahoo fantasy league. Mirrors
 * ESPNFantasyService.fetchRosteredPlayerNames: returns a Set of lowercased
 * full names, matched downstream by name. Best-effort — a failed roster page
 * ends paging and returns whatever was collected so far.
 */
export class YahooFantasyService {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly refreshToken: string,
    private readonly leagueKey: string
  ) {}

  public async fetchRosteredPlayerNames(): Promise<Set<string>> {
    const token = await refreshAccessToken(
      this.clientId,
      this.clientSecret,
      this.refreshToken
    );

    const names = new Set<string>();

    // Page through status=T until a short page comes back.
    for (let start = 0; ; start += PAGE_SIZE) {
      const url = `${API_BASE}/league/${this.leagueKey}/players;status=T;start=${start};count=${PAGE_SIZE}?format=json`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) break;

      const data = await res.json();
      const players = data?.fantasy_content?.league?.[1]?.players ?? {};

      let pageCount = 0;
      for (const key of Object.keys(players)) {
        if (key === "count") continue;
        const playerArr = players[key]?.player?.[0];
        if (!Array.isArray(playerArr)) continue;
        // Yahoo nests each player as an array of single-key objects.
        const flat = Object.assign({}, ...playerArr);
        const full: string | undefined = flat?.name?.full;
        if (full) names.add(full.toLowerCase());
        pageCount++;
      }

      if (pageCount < PAGE_SIZE) break;
    }

    return names;
  }
}
