export class PositionMapper {
  private readonly positionMap: Record<string, string> = {
    "1": "Pitcher",
    "2": "Catcher",
    "3": "First Base",
    "4": "Second Base",
    "5": "Third Base",
    "6": "Shortstop",
    "7": "Outfield",
    "8": "Outfield",
    "9": "Outfield",
    "10": "Designated Hitter",
    P: "Pitcher",
    C: "Catcher",
    "1B": "First Base",
    "2B": "Second Base",
    "3B": "Third Base",
    SS: "Shortstop",
    LF: "Outfield",
    CF: "Outfield",
    RF: "Outfield",
    DH: "Designated Hitter",
    SP: "Starting Pitcher",
    RP: "Relief Pitcher",
    UTIL: "Utility",
    Unknown: "Unknown",
  };

  public getFullPositionName(positionCode: string): string {
    return this.positionMap[positionCode] || positionCode;
  }

  public isOutfieldPosition(positionCode: string): boolean {
    return ["7", "8", "9", "LF", "CF", "RF"].includes(positionCode);
  }

  public isPitcherPosition(positionCode: string): boolean {
    return ["1", "P", "SP", "RP"].includes(positionCode);
  }
}
