import { describe, it, expect } from "vitest";
// Importing through the "@/*" alias proves tsconfig path resolution works under Vitest.
import { POINTS_SYSTEM } from "@/lib/mlb/points";

describe("vitest harness", () => {
  it("runs tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @/* path alias", () => {
    expect(POINTS_SYSTEM.totalBases).toBe(1);
  });
});
