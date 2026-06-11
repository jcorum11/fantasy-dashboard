import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppNav } from "@/src/presentation/components/AppNav";

// Proposed contract:
//   <AppNav /> — site-wide top navigation, rendered once from app/layout.tsx.
//   Links: Daily Stats (/), Weekly Points (/weekly-points),
//          Replacement Level (/replacement-level),
//          Pitcher Streaming (/pitcher-streaming).
//   The link matching usePathname() carries aria-current="page" — accessible
//   AND testable without coupling to Tailwind classes.
//   Plus one external support link (Buy me a coffee) that opens in a new tab
//   and never carries aria-current.

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("AppNav", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("renders a navigation landmark with all four page links", () => {
    render(<AppNav />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Daily Stats" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(
      screen.getByRole("link", { name: "Weekly Points" })
    ).toHaveAttribute("href", "/weekly-points");
    expect(
      screen.getByRole("link", { name: "Replacement Level" })
    ).toHaveAttribute("href", "/replacement-level");
    expect(
      screen.getByRole("link", { name: "Pitcher Streaming" })
    ).toHaveAttribute("href", "/pitcher-streaming");
  });

  it("marks the current route with aria-current=page", () => {
    usePathname.mockReturnValue("/pitcher-streaming");
    render(<AppNav />);

    expect(
      screen.getByRole("link", { name: "Pitcher Streaming" })
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Daily Stats" })
    ).not.toHaveAttribute("aria-current");
  });

  it("renders the support link as an external new-tab link", () => {
    render(<AppNav />);

    const link = screen.getByRole("link", { name: /buy me a coffee/i });
    expect(link).toHaveAttribute("href", "https://buymeacoffee.com/jcorum");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("marks Daily Stats current only on the exact root path", () => {
    usePathname.mockReturnValue("/weekly-points");
    render(<AppNav />);

    expect(
      screen.getByRole("link", { name: "Weekly Points" })
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Daily Stats" })
    ).not.toHaveAttribute("aria-current");
  });
});
