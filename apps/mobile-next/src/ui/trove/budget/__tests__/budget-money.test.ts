import { compactAmount, wholeAmount } from "../budget-money";
import { fillOffset, percent } from "../envelope-progress";
import { daysLeftText, paceChipLabel, paceChipText, safeToSpendLabel } from "../safe-to-spend-copy";

describe("compactAmount", () => {
  it("drops all-zero decimals and keeps ones that carry value", () => {
    expect(compactAmount(198_800, "AED")).toBe("1,988");
    expect(compactAmount(7_550, "AED")).toBe("75.50");
  });

  it("prints no sign", () => {
    expect(compactAmount(-24_000, "AED")).toBe("240");
  });

  it("handles zero-decimal currencies", () => {
    expect(compactAmount(1_500, "JPY")).toBe("1,500");
  });
});

describe("wholeAmount", () => {
  it("keeps grouped whole units only", () => {
    expect(wholeAmount(132_045, "AED")).toBe("1,320");
    expect(wholeAmount(-132_000, "AED")).toBe("1,320");
  });
});

describe("safe to spend copy", () => {
  it("prints the pace chip with the ISO code", () => {
    expect(paceChipText(198_800, 14_200, "AED")).toBe("≈ AED 142 A DAY");
    expect(paceChipLabel(198_800, 14_200, "AED")).toBe("about 142 AED a day");
  });

  it("prints a zero pace once nothing is safe to spend", () => {
    expect(paceChipText(0, 500, "AED")).toBe("AED 0 A DAY");
    expect(paceChipText(-24_000, 0, "AED")).toBe("AED 0 A DAY");
    expect(paceChipLabel(-24_000, 0, "AED")).toBe("0 AED a day");
  });

  it("counts days in the singular for one", () => {
    expect(daysLeftText(14)).toBe("14 DAYS");
    expect(daysLeftText(1)).toBe("1 DAY");
  });

  it("speaks the figure with a minus word", () => {
    expect(safeToSpendLabel(-24_000, "AED")).toBe("Safe to spend: minus 240.00 AED");
  });
});

describe("envelope progress", () => {
  it("slides the fill to its share and clamps out-of-range values", () => {
    expect(fillOffset(0.25, 200)).toBe(-150);
    expect(fillOffset(1.4, 200)).toBe(0);
    expect(fillOffset(Number.NaN, 200)).toBe(-200);
  });

  it("places markers as percentages", () => {
    expect(percent(0.55)).toBe("55%");
    expect(percent(0.5333)).toBe("53.3%");
    expect(percent(-1)).toBe("0%");
  });
});
