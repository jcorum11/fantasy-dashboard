import { describe, it, expect } from "vitest";
import { normalizeName, enrichWithRoster } from "./rosterEnrichment";

// Contract (drives the implementation):
//   normalizeName(name) -> lowercased, diacritics stripped
//   enrichWithRoster(players, rosteredNames) -> sets player.isRostered = true
//     when the player's normalized name is in the (normalized) rostered set;
//     mutates in place and returns the same array. Match is accent/case-insensitive.

describe("normalizeName", () => {
  it("lowercases", () => {
    expect(normalizeName("Mike Trout")).toBe("mike trout");
  });

  it("strips diacritics", () => {
    expect(normalizeName("José Ramírez")).toBe("jose ramirez");
  });
});

describe("enrichWithRoster", () => {
  const makePlayers = () => [
    { fullName: "Mike Trout", isRostered: false },
    { fullName: "José Ramírez", isRostered: false },
    { fullName: "Some Nobody", isRostered: false },
  ];

  it("marks players whose name is in the rostered set", () => {
    const players = makePlayers();
    enrichWithRoster(players, new Set(["mike trout"]));
    expect(players.find((p) => p.fullName === "Mike Trout")!.isRostered).toBe(
      true
    );
    expect(players.find((p) => p.fullName === "Some Nobody")!.isRostered).toBe(
      false
    );
  });

  it("matches accent-insensitively regardless of which side has the accents", () => {
    const players = makePlayers();
    // Yahoo could return either the accented or ascii form; both must match.
    enrichWithRoster(players, new Set(["josé ramírez"]));
    expect(
      players.find((p) => p.fullName === "José Ramírez")!.isRostered
    ).toBe(true);
  });

  it("leaves everyone unrostered when the set is empty (graceful default)", () => {
    const players = makePlayers();
    const result = enrichWithRoster(players, new Set());
    expect(players.every((p) => !p.isRostered)).toBe(true);
    expect(result).toBe(players); // returns the same array it mutated
  });
});
