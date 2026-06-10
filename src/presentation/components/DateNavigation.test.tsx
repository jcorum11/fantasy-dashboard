import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateNavigation } from "@/src/presentation/components/DateNavigation";

// Minimal coverage for the new optional label prop only — the component
// long predates this test file.

const baseProps = {
  currentDate: new Date(2026, 5, 9), // June 9 local
  isLoading: false,
  onPreviousDay: vi.fn(),
  onNextDay: vi.fn(),
  canNavigateNext: true,
};

describe("DateNavigation", () => {
  it("defaults to the original front-page label", () => {
    render(<DateNavigation {...baseProps} />);
    expect(screen.getByText(/Top Performers for/)).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    render(<DateNavigation {...baseProps} label="Streaming picks for" />);
    expect(screen.getByText(/Streaming picks for/)).toBeInTheDocument();
    expect(screen.queryByText(/Top Performers for/)).not.toBeInTheDocument();
  });
});
