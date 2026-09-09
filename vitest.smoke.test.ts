import { describe, it, expect } from "vitest";
// Importing through the "@/*" alias proves tsconfig path resolution works under Vitest.
import { YAHOO } from "@/lib/mlb/points";

describe("vitest harness", () => {
  it("runs tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @/* path alias", () => {
    expect(YAHOO.POINTS_SYSTEM.homeRuns).toBe(10.4);
  });
});
