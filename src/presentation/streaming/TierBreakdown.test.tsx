import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TierBreakdown } from "@/src/presentation/streaming/TierBreakdown";
import { makeReport } from "@/src/presentation/streaming/ComparisonGrid.mocks";

// Proposed contract:
//   <TierBreakdown resources={report.resources} />
//   For each resource that HAS native tiers, a table of tier rows in the
//   API's order with "avg (n)" cells. Resources without tiers (DailyWaivers,
//   FantasyPros) render nothing.

describe("TierBreakdown", () => {
  it("renders tier rows in order for resources with tiers", () => {
    render(<TierBreakdown resources={makeReport().resources} />);

    const table = screen.getByRole("table");
    const rows = within(table)
      .getAllByRole("rowheader")
      .map((r) => r.textContent);
    expect(rows).toEqual([
      "Auto-Starts",
      "Probably Starts",
      "Questionable Starts",
      "Do Not Starts",
    ]);

    const auto = within(table)
      .getByRole("rowheader", { name: "Auto-Starts" })
      .closest("tr")!;
    expect(within(auto).getByText("23.6")).toBeInTheDocument();
    expect(within(auto).getByText("(n=431)")).toBeInTheDocument();
  });

  it("renders nothing for resources without native tiers", () => {
    const untieredOnly = makeReport().resources.filter(
      (r) => r.resource !== "pitcherlist"
    );
    const { container } = render(<TierBreakdown resources={untieredOnly} />);

    expect(container).toBeEmptyDOMElement();
  });
});
