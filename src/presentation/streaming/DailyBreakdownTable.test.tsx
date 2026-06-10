import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DailyBreakdownTable } from "@/src/presentation/streaming/DailyBreakdownTable";
import { makeBreakdown } from "@/src/presentation/streaming/DailyBreakdownTable.mocks";

// Proposed contract:
//   <DailyBreakdownTable breakdown={dailyBreakdown} />
//   - A per-resource day record line: "Pitcher List 1W–0L" etc.
//   - One row per pitcher (in the API's order): name + matchup
//     ("@ CHW" away / "vs LAD" home), actual points, and one cell per
//     resource showing the call (rank or tier) with a win/loss badge.
//   - A resource that didn't list the pitcher shows "—".
//   - Unscored rows show their status ("pending" / "no start") not points.

describe("DailyBreakdownTable", () => {
  it("shows each resource's day record", () => {
    render(<DailyBreakdownTable breakdown={makeBreakdown()} />);

    expect(screen.getByText(/DailyWaivers 1W–1L/)).toBeInTheDocument();
    expect(screen.getByText(/Pitcher List 2W–0L/)).toBeInTheDocument();
    expect(screen.getByText(/FantasyPros 0W–0L/)).toBeInTheDocument();
  });

  it("renders pitcher rows with matchup and actual points", () => {
    render(<DailyBreakdownTable breakdown={makeBreakdown()} />);

    const sale = screen.getByRole("rowheader", { name: /Chris Sale/ })
      .closest("tr")!;
    expect(within(sale).getByText("@ CHW")).toBeInTheDocument();
    expect(within(sale).getByText("27.9")).toBeInTheDocument();

    const badCall = screen.getByRole("rowheader", { name: /Bad Call/ })
      .closest("tr")!;
    expect(within(badCall).getByText("vs LAD")).toBeInTheDocument();
  });

  it("marks wins and losses on the resource calls", () => {
    render(<DailyBreakdownTable breakdown={makeBreakdown()} />);

    const badCall = screen.getByRole("rowheader", { name: /Bad Call/ })
      .closest("tr")!;
    // DW sold him high -> loss; PL's Do Not Start was a correct avoid -> win
    expect(within(badCall).getByLabelText("loss")).toBeInTheDocument();
    expect(within(badCall).getByLabelText("win")).toBeInTheDocument();

    const sale = screen.getByRole("rowheader", { name: /Chris Sale/ })
      .closest("tr")!;
    expect(within(sale).getAllByLabelText("win")).toHaveLength(2);
  });

  it("shows the call as tier when present, otherwise rank", () => {
    render(<DailyBreakdownTable breakdown={makeBreakdown()} />);

    const badCall = screen.getByRole("rowheader", { name: /Bad Call/ })
      .closest("tr")!;
    expect(within(badCall).getByText(/Do Not Starts/)).toBeInTheDocument();
    expect(within(badCall).getByText(/#2/)).toBeInTheDocument(); // DW rank
  });

  it("shows an em dash for resources that did not list the pitcher", () => {
    render(<DailyBreakdownTable breakdown={makeBreakdown()} />);

    const sale = screen.getByRole("rowheader", { name: /Chris Sale/ })
      .closest("tr")!;
    expect(within(sale).getAllByText("—").length).toBeGreaterThan(0); // FP column
  });

  it("shows status instead of points for unscored pitchers", () => {
    render(<DailyBreakdownTable breakdown={makeBreakdown()} />);

    const scratched = screen.getByRole("rowheader", { name: /Scratched Guy/ })
      .closest("tr")!;
    expect(within(scratched).getByText(/no start/i)).toBeInTheDocument();
  });
});
