import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ComparisonGrid } from "@/src/presentation/streaming/ComparisonGrid";
import { makeReport } from "@/src/presentation/streaming/ComparisonGrid.mocks";

// Proposed contract:
//   <ComparisonGrid resources={report.resources} />
//   A table: one column per resource (always all three), one row per
//   segment — Overall, then High/Mid/Low buckets. Every cell shows
//   "avg (n)" where n is the SCORED count, or "—" when nothing scored.

describe("ComparisonGrid", () => {
  it("renders a column per resource and a row per segment", () => {
    render(<ComparisonGrid resources={makeReport().resources} />);

    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: /FantasyPros/i })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /Pitcher List/i })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /DailyWaivers/i })
    ).toBeInTheDocument();

    for (const segment of ["Overall", "High", "Mid", "Low"]) {
      expect(
        within(table).getByRole("rowheader", { name: segment })
      ).toBeInTheDocument();
    }
  });

  it("shows avg with scored sample size in each cell", () => {
    render(<ComparisonGrid resources={makeReport().resources} />);

    const overall = screen.getByRole("rowheader", { name: "Overall" })
      .closest("tr")!;
    expect(within(overall).getByText("16.7")).toBeInTheDocument();
    expect(within(overall).getByText("(n=1966)")).toBeInTheDocument();
    expect(within(overall).getByText("16.1")).toBeInTheDocument();
    expect(within(overall).getByText("(n=2039)")).toBeInTheDocument();
  });

  it("renders an em dash for segments with no scored picks", () => {
    render(<ComparisonGrid resources={makeReport().resources} />);

    // FantasyPros has no data at all — its Overall cell is just "—"
    const overall = screen.getByRole("rowheader", { name: "Overall" })
      .closest("tr")!;
    expect(within(overall).getAllByText("—").length).toBeGreaterThan(0);
  });
});
