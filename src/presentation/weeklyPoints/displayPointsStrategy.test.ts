import { describe, it, expect } from "vitest";
import { defaultDisplayPointsStrategy } from "@/src/presentation/weeklyPoints/displayPointsStrategy";

describe("defaultDisplayPointsStrategy", () => {
  it("returns the most recent non-zero week at or before the index", () => {
    expect(defaultDisplayPointsStrategy([10, 20, 0, 0], 3)).toBe(20);
  });

  it("ignores weeks after the given index", () => {
    expect(defaultDisplayPointsStrategy([1, 2, 3], 1)).toBe(2);
  });

  it("walks all the way back to the first week if needed", () => {
    expect(defaultDisplayPointsStrategy([5, 0, 0], 2)).toBe(5);
  });

  it("treats negative points as a valid non-zero value", () => {
    expect(defaultDisplayPointsStrategy([-3, 0], 1)).toBe(-3);
  });

  it("returns 0 when every week is zero", () => {
    expect(defaultDisplayPointsStrategy([0, 0, 0], 2)).toBe(0);
  });

  it("returns 0 for an empty week list", () => {
    expect(defaultDisplayPointsStrategy([], -1)).toBe(0);
  });

  it("tolerates sparse arrays (undefined => 0)", () => {
    const sparse = [4];
    expect(defaultDisplayPointsStrategy(sparse, 2)).toBe(4);
  });
});
