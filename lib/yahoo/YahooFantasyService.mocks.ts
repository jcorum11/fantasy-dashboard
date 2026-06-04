// Test fixtures/mocks for YahooFantasyService.

// A trimmed copy of a real /league/<key>/players;status=T;count=25 payload —
// the nested "array of single-key objects" shape, with the index-keyed map + count.
export const ROSTER_PAGE = {
  fantasy_content: {
    league: [
      { league_key: "469.l.154856", name: "Sons of Pitches" },
      {
        players: {
          "0": {
            player: [
              [
                { player_key: "469.p.8193" },
                { player_id: "8193" },
                {
                  name: {
                    full: "Max Scherzer",
                    first: "Max",
                    last: "Scherzer",
                    ascii_first: "Max",
                    ascii_last: "Scherzer",
                  },
                },
                { editorial_team_abbr: "TOR" },
              ],
            ],
          },
          "1": {
            player: [
              [
                { player_key: "469.p.8616" },
                { player_id: "8616" },
                {
                  name: {
                    full: "Aroldis Chapman",
                    first: "Aroldis",
                    last: "Chapman",
                    ascii_first: "Aroldis",
                    ascii_last: "Chapman",
                  },
                },
                { editorial_team_abbr: "BOS" },
              ],
            ],
          },
          count: 2,
        },
      },
    ],
  },
};

/** Build a minimal ok Response-like object whose .json() resolves to `body`. */
export function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

/** A non-ok Response-like object (for failure/degradation paths). */
export function errorResponse(status = 500) {
  return { ok: false, status, json: async () => ({}) } as Response;
}

/** Build a status=T roster page in Yahoo's nested shape from a list of names. */
export function makeRosterPage(fullNames: string[]) {
  const players: Record<string, unknown> = { count: fullNames.length };
  fullNames.forEach((full, i) => {
    players[String(i)] = {
      player: [[{ player_key: `469.p.${i}` }, { name: { full } }]],
    };
  });
  return {
    fantasy_content: {
      league: [{ league_key: "469.l.154856" }, { players }],
    },
  };
}

/** A page with one valid player and one player missing its name object. */
export const MALFORMED_ROSTER_PAGE = {
  fantasy_content: {
    league: [
      { league_key: "469.l.154856" },
      {
        players: {
          "0": {
            player: [[{ player_key: "469.p.1" }, { name: { full: "Real Player" } }]],
          },
          "1": {
            player: [[{ player_key: "469.p.2" }, { editorial_team_abbr: "NYY" }]],
          },
          count: 2,
        },
      },
    ],
  },
};
