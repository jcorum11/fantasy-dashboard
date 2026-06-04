import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Home fetches scored stats on mount and whenever inputs change. Capture the
// PlayerStatsClient.getPlayerStats mock so we can assert which platform it was
// asked to score for. (vi.hoisted runs with the hoisted vi.mock below.)
const { getPlayerStatsMock } = vi.hoisted(() => ({
  getPlayerStatsMock: vi.fn(),
}));

vi.mock("@/src/application/services/PlayerStatsClient", () => ({
  PlayerStatsClient: vi.fn(() => ({ getPlayerStats: getPlayerStatsMock })),
}));

import Home from "./page";

beforeEach(() => {
  getPlayerStatsMock.mockReset();
  getPlayerStatsMock.mockResolvedValue({ stats: [] });
  // weekly-points / roster fetch — not the scoring path, just keep it quiet.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home", () => {
  it("renders the platform buttons above the date buttons", async () => {
    render(<Home />);

    const yahoo = await screen.findByRole("button", { name: "Yahoo" });
    const previousDay = screen.getByRole("button", { name: "Previous Day" });

    expect(
      yahoo.compareDocumentPosition(previousDay) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("defaults to the Yahoo platform", async () => {
    render(<Home />);

    expect(await screen.findByRole("button", { name: "Yahoo" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "ESPN" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("scores with Yahoo on the initial load (default platform)", async () => {
    render(<Home />);
    await screen.findByRole("button", { name: "Yahoo" });

    expect(getPlayerStatsMock).toHaveBeenCalledWith(expect.any(String), "yahoo");
  });

  it("refetches scored for ESPN when the ESPN button is clicked", async () => {
    render(<Home />);
    await screen.findByRole("button", { name: "ESPN" });
    getPlayerStatsMock.mockClear(); // ignore the initial (yahoo) mount fetch

    await userEvent.click(screen.getByRole("button", { name: "ESPN" }));

    expect(getPlayerStatsMock).toHaveBeenCalledWith(expect.any(String), "espn");
  });

  it("refetches scored for Yahoo when Yahoo is re-selected", async () => {
    render(<Home />);
    await screen.findByRole("button", { name: "ESPN" });
    await userEvent.click(screen.getByRole("button", { name: "ESPN" }));
    getPlayerStatsMock.mockClear(); // isolate the yahoo re-selection

    await userEvent.click(screen.getByRole("button", { name: "Yahoo" }));

    expect(getPlayerStatsMock).toHaveBeenCalledWith(expect.any(String), "yahoo");
  });
});
