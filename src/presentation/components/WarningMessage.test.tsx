import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarningMessage } from "@/src/presentation/components/WarningMessage";

describe("WarningMessage", () => {
  it("renders the provided message", () => {
    render(<WarningMessage message="No games scheduled" />);
    expect(screen.getByText("No games scheduled")).toBeInTheDocument();
  });
});
