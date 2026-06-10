import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceHealth } from "@/src/presentation/streaming/ResourceHealth";
import { makeReport } from "@/src/presentation/streaming/ComparisonGrid.mocks";

// Proposed contract:
//   <ResourceHealth resources={report.resources} />
//   One status chip per resource (Jacob's degradation rule — failures are
//   explicit, never silently absent):
//     - failedDays > 0  -> role="status" warning naming the resource and
//                          the failed-day count
//     - picks === 0     -> explicit "No data" state for that resource
//     - otherwise       -> an OK state with the success-day count

describe("ResourceHealth", () => {
  const resources = makeReport().resources;

  it("warns when a resource has failed ingest days", () => {
    render(<ResourceHealth resources={resources} />);

    const warning = screen
      .getAllByRole("status")
      .find((el) => /DailyWaivers/i.test(el.textContent ?? ""))!;
    expect(warning.textContent).toMatch(/2 failed/i);
  });

  it("shows an explicit no-data state instead of hiding an empty resource", () => {
    render(<ResourceHealth resources={resources} />);

    const fp = screen
      .getAllByRole("status")
      .find((el) => /FantasyPros/i.test(el.textContent ?? ""))!;
    expect(fp.textContent).toMatch(/no data/i);
  });

  it("shows an ok state with success-day count when healthy", () => {
    render(<ResourceHealth resources={resources} />);

    const pl = screen
      .getAllByRole("status")
      .find((el) => /Pitcher List/i.test(el.textContent ?? ""))!;
    expect(pl.textContent).toMatch(/1 ingest day/i);
    expect(pl.textContent).not.toMatch(/failed|no data/i);
  });
});
