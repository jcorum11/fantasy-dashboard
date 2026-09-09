import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppNav } from "@/src/presentation/components/AppNav";

// <AppNav /> — site-wide top navigation, rendered once from app/layout.tsx.
// The link matching usePathname() carries aria-current="page".

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("AppNav", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("renders a navigation landmark with the Players link", () => {
    render(<AppNav />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Players" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("links out to buy-me-a-coffee in a new tab", () => {
    render(<AppNav />);

    const link = screen.getByRole("link", { name: /Buy me a coffee/ });
    expect(link).toHaveAttribute("href", "https://buymeacoffee.com/jcorum");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("marks Players current only on the exact root path", () => {
    usePathname.mockReturnValue("/players/123");
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Players" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("marks the current route with aria-current=page", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Players" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});
