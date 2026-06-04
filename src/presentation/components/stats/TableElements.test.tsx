import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { PointsCell } from "@/src/presentation/components/stats/TableElements";

// A <td> must live inside a table row to be valid markup and to expose role="cell".
function renderCell(ui: ReactNode) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>
  );
}

describe("PointsCell", () => {
  it("rounds points to a whole number for ESPN", () => {
    renderCell(<PointsCell points={12.4} platform="espn" />);
    // 12.4 -> "12", no decimal shown
    expect(screen.getByRole("cell")).toHaveTextContent(/^12$/);
  });

  it("shows two decimal places for Yahoo (matching the Yahoo UI)", () => {
    renderCell(<PointsCell points={12.4} platform="yahoo" />);
    // Always two decimals, even when the last is a trailing zero.
    expect(screen.getByRole("cell")).toHaveTextContent(/^12\.40$/);
  });
});
