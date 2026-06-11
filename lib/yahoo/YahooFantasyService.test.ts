import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  YahooFantasyService,
  refreshAccessToken,
} from "./YahooFantasyService";
import {
  ROSTER_PAGE,
  MALFORMED_ROSTER_PAGE,
  makeRosterPage,
  jsonResponse,
  errorResponse,
} from "./YahooFantasyService.mocks";

// Assumed contract (drives the implementation):
//   refreshAccessToken(clientId, clientSecret, refreshToken) -> Promise<string>
//   new YahooFantasyService(clientId, clientSecret, refreshToken, leagueKey)
//     .fetchRosteredPlayerNames() -> Promise<Set<string>>  (lowercased full names)
//
// Contract decisions pinned below (adjust if you disagree):
//   - refreshAccessToken THROWS on a non-ok token response.
//   - fetchRosteredPlayerNames is best-effort: a failed roster page ends paging
//     and returns whatever was collected so far (no throw).

const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

function newService() {
  return new YahooFantasyService(
    "client-id",
    "client-secret",
    "refresh-token",
    "469.l.154856"
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("YahooFantasyService", () => {
  describe("fetchRosteredPlayerNames", () => {
    it("returns player names that matches the shape of the mock", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "test.access.token" }))
        .mockResolvedValueOnce(jsonResponse(ROSTER_PAGE));

      const names = await newService().fetchRosteredPlayerNames();

      expect(names).toBeInstanceOf(Set);
      expect(names.has("max scherzer")).toBe(true);
      expect(names.has("aroldis chapman")).toBe(true);
      expect(names.size).toBe(2);
    });

    it("pages through every result until a short page, refreshing the token once", async () => {
      const page1 = makeRosterPage(
        Array.from({ length: 25 }, (_, i) => `Player ${i}`)
      );
      const page2 = makeRosterPage(["Extra One", "Extra Two"]); // short page -> stop

      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "test.access.token" }))
        .mockResolvedValueOnce(jsonResponse(page1))
        .mockResolvedValueOnce(jsonResponse(page2));

      const names = await newService().fetchRosteredPlayerNames();

      expect(names.size).toBe(27);
      expect(names.has("player 0")).toBe(true);
      expect(names.has("extra two")).toBe(true);

      // token fetched exactly once, then one fetch per page
      const tokenCalls = fetchMock.mock.calls.filter((c) => c[0] === TOKEN_URL);
      expect(tokenCalls).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // paging advances start by the page size
      expect(fetchMock.mock.calls[1][0]).toContain("start=0");
      expect(fetchMock.mock.calls[2][0]).toContain("start=25");
    });

    it("requests status=T for the league using the refreshed bearer token", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "test.access.token" }))
        .mockResolvedValueOnce(jsonResponse(ROSTER_PAGE));

      await newService().fetchRosteredPlayerNames();

      const [url, opts] = fetchMock.mock.calls[1];
      expect(url).toContain("/league/469.l.154856/players;status=T");
      expect((opts as RequestInit).headers).toMatchObject({
        Authorization: "Bearer test.access.token",
      });
    });

    it("returns an empty set when the league has no rostered players", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "test.access.token" }))
        .mockResolvedValueOnce(jsonResponse(makeRosterPage([])));

      const names = await newService().fetchRosteredPlayerNames();
      expect(names.size).toBe(0);
    });

    it("skips players that have no full name", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "test.access.token" }))
        .mockResolvedValueOnce(jsonResponse(MALFORMED_ROSTER_PAGE));

      const names = await newService().fetchRosteredPlayerNames();
      expect(names.has("real player")).toBe(true);
      expect(names.size).toBe(1);
    });

    it("degrades to an empty set when a roster page request fails", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "test.access.token" }))
        .mockResolvedValueOnce(errorResponse(500));

      const names = await newService().fetchRosteredPlayerNames();
      expect(names.size).toBe(0);
    });
  });

  describe("tokenRefreshHelper", () => {
    it("returns a token of the desired shape/regex pattern", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ access_token: "AbC123.def-456_GHI", token_type: "bearer" })
      );

      const token = await refreshAccessToken(
        "client-id",
        "client-secret",
        "refresh-token"
      );

      expect(typeof token).toBe("string");
      expect(token).toMatch(/^[\w.-]+$/);
    });

    it("POSTs grant_type=refresh_token with basic auth to the token endpoint", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "t" }));

      await refreshAccessToken("client-id", "client-secret", "refresh-token");

      const [url, opts] = fetchMock.mock.calls[0];
      const { method, body, headers } = opts as RequestInit;
      expect(url).toBe(TOKEN_URL);
      expect(method).toBe("POST");
      expect(String(body)).toContain("grant_type=refresh_token");
      expect(String(body)).toContain("refresh_token=refresh-token");
      const expectedBasic =
        "Basic " + Buffer.from("client-id:client-secret").toString("base64");
      expect((headers as Record<string, string>).Authorization).toBe(
        expectedBasic
      );
    });

    it("throws when Yahoo rejects the refresh", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(401));

      await expect(
        refreshAccessToken("client-id", "client-secret", "bad-refresh")
      ).rejects.toThrow();
    });

    it("includes redirect_uri only when YAHOO_REDIRECT_URI is set", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ access_token: "t" }));

      await refreshAccessToken("client-id", "client-secret", "refresh-token");
      expect(String(fetchMock.mock.calls[0][1].body)).not.toContain(
        "redirect_uri"
      );

      vi.stubEnv(
        "YAHOO_REDIRECT_URI",
        "https://example.com/api/auth/yahoo/callback"
      );
      await refreshAccessToken("client-id", "client-secret", "refresh-token");
      expect(String(fetchMock.mock.calls[1][1].body)).toContain(
        `redirect_uri=${encodeURIComponent(
          "https://example.com/api/auth/yahoo/callback"
        )}`
      );
    });
  });
});
