import { codeAmount, codeBalance, entryFigure, signedCompact } from "../payday-money";

describe("entryFigure", () => {
  it("splits a typed salary into grouped units and decimals", () => {
    expect(entryFigure("17000", "AED")).toEqual({ whole: "17,000", fraction: ".00", empty: false });
    expect(entryFigure("64.5", "AED")).toEqual({ whole: "64", fraction: ".50", empty: false });
  });

  it("shows 0 for nothing typed", () => {
    expect(entryFigure("", "AED")).toEqual({ whole: "0", fraction: ".00", empty: true });
  });
});

describe("receipt and sentence figures", () => {
  it("drops all-zero decimals and prints its own minus", () => {
    expect(signedCompact(198_800, "AED")).toBe("1,988");
    expect(signedCompact(-17_500, "AED")).toBe("−175");
    expect(codeAmount(426_000, "AED")).toBe("AED 4,260");
    expect(codeAmount(-12_050, "AED")).toBe("−AED 120.50");
  });

  it("keeps a balance's decimals", () => {
    expect(codeBalance(986_050, "AED")).toBe("AED 9,860.50");
    expect(codeBalance(21_000, "AED")).toBe("AED 210.00");
  });
});
