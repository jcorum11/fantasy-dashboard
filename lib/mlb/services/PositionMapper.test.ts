import { describe, it, expect, beforeEach } from "vitest";
import { PositionMapper } from "@/lib/mlb/services/PositionMapper";

describe("PositionMapper", () => {
  let mapper: PositionMapper;

  beforeEach(() => {
    mapper = new PositionMapper();
  });

  describe("getFullPositionName", () => {
    it("maps numeric position codes", () => {
      expect(mapper.getFullPositionName("1")).toBe("Pitcher");
      expect(mapper.getFullPositionName("6")).toBe("Shortstop");
      expect(mapper.getFullPositionName("7")).toBe("Outfield");
      expect(mapper.getFullPositionName("10")).toBe("Designated Hitter");
    });

    it("maps abbreviation codes", () => {
      expect(mapper.getFullPositionName("SS")).toBe("Shortstop");
      expect(mapper.getFullPositionName("SP")).toBe("Starting Pitcher");
      expect(mapper.getFullPositionName("RP")).toBe("Relief Pitcher");
      expect(mapper.getFullPositionName("DH")).toBe("Designated Hitter");
    });

    it("returns the original code when unmapped", () => {
      expect(mapper.getFullPositionName("99")).toBe("99");
      expect(mapper.getFullPositionName("XYZ")).toBe("XYZ");
    });
  });

  describe("isOutfieldPosition", () => {
    it("recognizes numeric and lettered outfield codes", () => {
      for (const code of ["7", "8", "9", "LF", "CF", "RF"]) {
        expect(mapper.isOutfieldPosition(code)).toBe(true);
      }
    });

    it("rejects non-outfield codes", () => {
      expect(mapper.isOutfieldPosition("1")).toBe(false);
      expect(mapper.isOutfieldPosition("SS")).toBe(false);
    });
  });

  describe("isPitcherPosition", () => {
    it("recognizes pitcher codes", () => {
      for (const code of ["1", "P", "SP", "RP"]) {
        expect(mapper.isPitcherPosition(code)).toBe(true);
      }
    });

    it("rejects non-pitcher codes", () => {
      expect(mapper.isPitcherPosition("2")).toBe(false);
      expect(mapper.isPitcherPosition("CF")).toBe(false);
    });
  });
});
