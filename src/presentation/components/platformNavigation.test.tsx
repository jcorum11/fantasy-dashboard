import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlatformNavigation } from "@/src/presentation/components/PlatformNavigation";

// Proposed contract (controlled, mirrors ViewTypeToggle):
//   platform: "yahoo" | "espn"        -- the currently-selected platform
//   onPlatformChange: (p) => void     -- called when a platform button is clicked
// Selected state is exposed via aria-pressed so it's accessible AND testable
// without coupling the test to Tailwind classes.

describe("PlatformNavigation", () => {
  it("renders a button for each platform", () => {
    render(<PlatformNavigation platform="espn" onPlatformChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Yahoo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ESPN" })).toBeInTheDocument();
  });

  it("marks the selected platform as pressed and the other as not", () => {
    render(<PlatformNavigation platform="espn" onPlatformChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "ESPN" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Yahoo" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("notifies the parent with the platform that was clicked", async () => {
    const onPlatformChange = vi.fn();
    render(
      <PlatformNavigation platform="espn" onPlatformChange={onPlatformChange} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Yahoo" }));

    expect(onPlatformChange).toHaveBeenCalledTimes(1);
    expect(onPlatformChange).toHaveBeenCalledWith("yahoo");
  });

  it("notifies with espn when the ESPN button is clicked", async () => {
    const onPlatformChange = vi.fn();
    render(
      <PlatformNavigation platform="yahoo" onPlatformChange={onPlatformChange} />
    );

    await userEvent.click(screen.getByRole("button", { name: "ESPN" }));

    expect(onPlatformChange).toHaveBeenCalledWith("espn");
  });
});
