import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerList } from "./PlayerList";
import { PlayerSummary } from "@/src/domain/models/PlayerSummary";

const players: PlayerSummary[] = [
  { id: 1, name: "Shohei Ohtani", team: "Los Angeles Dodgers", position: "DH", points: 1716.6, games: 134 },
  { id: 2, name: "Pete Crow-Armstrong", team: "Chicago Cubs", position: "CF", points: 1606.7, games: 146 },
  { id: 3, name: "Paul Skenes", team: "Pittsburgh Pirates", position: "P", points: 900, games: 30 },
];

describe("PlayerList", () => {
  it("ranks players in the order given and links each to their page", () => {
    render(<PlayerList players={players} season={2026} />);

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("1");
    expect(within(rows[0]).getByRole("link", { name: "Shohei Ohtani" })).toHaveAttribute(
      "href",
      "/players/1"
    );
    expect(rows[0]).toHaveTextContent("1716.6");
    expect(screen.getByText("3 players · 2026 regular season")).toBeInTheDocument();
  });

  it("filters by name, case-insensitively, as you type", async () => {
    const user = userEvent.setup();
    render(<PlayerList players={players} season={2026} />);

    await user.type(screen.getByRole("searchbox", { name: "Search players" }), "crow");

    expect(screen.getByRole("link", { name: "Pete Crow-Armstrong" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Shohei Ohtani" })).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3 players")).toBeInTheDocument();
  });

  it("matches team names and exact positions too", async () => {
    const user = userEvent.setup();
    render(<PlayerList players={players} season={2026} />);
    const box = screen.getByRole("searchbox", { name: "Search players" });

    await user.type(box, "pirates");
    expect(screen.getByRole("link", { name: "Paul Skenes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Shohei Ohtani" })).not.toBeInTheDocument();

    await user.clear(box);
    await user.type(box, "dh");
    expect(screen.getByRole("link", { name: "Shohei Ohtani" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Paul Skenes" })).not.toBeInTheDocument();
  });

  it("keeps original ranks when filtered and shows an empty state", async () => {
    const user = userEvent.setup();
    render(<PlayerList players={players} season={2026} />);
    const box = screen.getByRole("searchbox", { name: "Search players" });

    await user.type(box, "skenes");
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("3");

    await user.clear(box);
    await user.type(box, "zzz");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/No players match .zzz./)).toBeInTheDocument();
  });
});
