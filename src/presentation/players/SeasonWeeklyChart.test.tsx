import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeasonWeeklyChart } from "./SeasonWeeklyChart";
import { SeasonWeeklyPoints } from "@/src/domain/models/WeeklyPoints";

const season2026: SeasonWeeklyPoints = {
  playerId: 1,
  season: 2026,
  totalPoints: 30,
  games: 3,
  weeks: [
    { week: 1, start: "2026-03-23", end: "2026-03-29", points: 10, games: 2 },
    { week: 2, start: "2026-03-30", end: "2026-04-05", points: 0, games: 0 },
    { week: 3, start: "2026-04-06", end: "2026-04-12", points: 20, games: 1 },
  ],
};

const season2025: SeasonWeeklyPoints = {
  playerId: 1,
  season: 2025,
  totalPoints: 5,
  games: 1,
  weeks: [{ week: 1, start: "2025-03-24", end: "2025-03-30", points: 5, games: 1 }],
};

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => fetchMock.mockReset());

describe("SeasonWeeklyChart", () => {
  it("shows the initial season's summary, marks it selected, and lists every week in the table", () => {
    render(<SeasonWeeklyChart playerId={1} seasons={[2025, 2026]} initial={season2026} />);

    expect(screen.getByRole("heading", { name: "2026 weekly points" })).toBeInTheDocument();
    expect(screen.getByText("3 games · 2 weeks played")).toBeInTheDocument();
    expect(screen.getByText("30.0")).toBeInTheDocument(); // total
    expect(screen.getByText("15.0")).toBeInTheDocument(); // avg over weeks played
    expect(screen.getByText("20.0 (wk 3)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "2025" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Mar 30 – Apr 5")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads another season from the API when its button is clicked", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => season2025 });
    const user = userEvent.setup();
    render(<SeasonWeeklyChart playerId={1} seasons={[2025, 2026]} initial={season2026} />);

    await user.click(screen.getByRole("button", { name: "2025" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "2025 weekly points" })).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/players/1/seasons/2025");
    await waitFor(() => expect(screen.getByText("1 game · 1 week played")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "2025" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reports a failed load and keeps the previous season's data on screen", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502 });
    const user = userEvent.setup();
    render(<SeasonWeeklyChart playerId={1} seasons={[2025, 2026]} initial={season2026} />);

    await user.click(screen.getByRole("button", { name: "2025" }));

    await waitFor(() =>
      expect(screen.getByText("Couldn't load the 2025 season.")).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: "2026 weekly points" })).toBeInTheDocument();
  });
});
