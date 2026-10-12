import {
  envelopeEmoji,
  envelopeHero,
  envelopeReceiptLines,
  overBannerText,
  periodPace,
  spendingListTitle,
} from "../envelope-display";
import { codeAmount, receiptFigure, signedCompact } from "../envelope-figures";

describe("envelope figures", () => {
  it("prints receipt figures with decimals and a true minus", () => {
    expect(receiptFigure(150_000, "AED")).toBe("1,500.00");
    expect(receiptFigure(-101_200, "AED")).toBe("−1,012.00");
    expect(receiptFigure(0, "AED")).toBe("0.00");
  });

  it("drops all-zero decimals in compact figures", () => {
    expect(signedCompact(58_800, "AED")).toBe("588");
    expect(signedCompact(-17_500, "AED")).toBe("−175");
    expect(signedCompact(7_550, "AED")).toBe("75.50");
    expect(codeAmount(17_500, "AED")).toBe("AED 175");
  });
});

describe("envelopeEmoji", () => {
  const categories = new Map([
    ["slug", { icon: "tag" }],
    ["food", { icon: "🛒" }],
    ["eat", { icon: "🍽️" }],
  ]);

  it("wears the first mapped Category's emoji", () => {
    expect(envelopeEmoji({ categoryIds: ["missing", "food", "eat"] }, categories)).toBe("🛒");
  });

  it("falls back to the tag without a mapped Category or for a legacy icon slug", () => {
    expect(envelopeEmoji({ categoryIds: [] }, categories)).toBe("🏷️");
    expect(envelopeEmoji({ categoryIds: ["slug", "food"] }, categories)).toBe("🏷️");
  });
});

describe("periodPace", () => {
  it("is the share of the period gone", () => {
    // 1–31 October with 14 days to go (today included): 17 of 31 days gone.
    expect(periodPace({ start: "2026-10-01", end: "2026-10-31" }, 14)).toBeCloseTo(17 / 31);
  });

  it("stays within the bar", () => {
    expect(periodPace({ start: "2026-10-01", end: "2026-10-31" }, 40)).toBe(0);
    expect(periodPace({ start: "2026-10-01", end: "2026-10-31" }, 0)).toBe(1);
  });
});

describe("envelopeHero", () => {
  it("shows what is left of plan plus carry, and the pace that keeps it", () => {
    const hero = envelopeHero(
      { plannedMinor: 150_000, rolloverMinor: 10_000, leftMinor: 58_800 },
      14,
      "AED",
    );
    expect(hero.figure).toBe("588");
    expect(hero.ofLine).toBe("of 1,600 planned · 14 days to go");
    expect(hero.progress).toBeCloseTo(1_012 / 1_600);
    expect(hero.over).toBe(false);
    expect(hero.chip).toEqual({ text: "≈ AED 42 A DAY KEEPS YOU ON PLAN", tone: "ok" });
  });

  it("fills the bar and says nothing is left when over", () => {
    const hero = envelopeHero(
      { plannedMinor: 60_000, rolloverMinor: 0, leftMinor: -17_500 },
      1,
      "AED",
    );
    expect(hero.figure).toBe("−175");
    expect(hero.ofLine).toBe("of 600 planned · 1 day to go");
    expect(hero.progress).toBe(1);
    expect(hero.chip).toEqual({ text: "NOTHING LEFT TO SPEND HERE", tone: "neg" });
    expect(hero.accessibilityLabel).toBe("Left: minus 175.00 AED. Over budget.");
  });

  it("names what is left when the period is over", () => {
    const hero = envelopeHero(
      { plannedMinor: 10_000, rolloverMinor: 0, leftMinor: 2_000 },
      0,
      "AED",
    );
    expect(hero.chip).toEqual({ text: "AED 20 LEFT TO SPEND", tone: "ok" });
  });
});

describe("envelopeReceiptLines", () => {
  it("prints plan, carry and spending", () => {
    expect(
      envelopeReceiptLines(
        {
          plannedMinor: 150_000,
          budgetedMinor: 150_000,
          rolloverMinor: 10_000,
          spentMinor: 101_200,
        },
        "AED",
      ),
    ).toEqual([
      { label: "PLANNED", value: "1,500.00" },
      { label: "FROM LAST MONTH", value: "100.00" },
      { label: "SPENT", value: "−1,012.00" },
    ]);
  });

  it("adds money moved in or out since the plan, so the lines still add up to Left", () => {
    const moved = (plannedMinor: number) =>
      envelopeReceiptLines(
        { plannedMinor, budgetedMinor: 60_000, rolloverMinor: 0, spentMinor: 77_500 },
        "AED",
      )[1];
    expect(moved(77_500)).toEqual({ label: "MOVED IN", value: "175.00" });
    expect(moved(50_000)).toEqual({ label: "MOVED OUT", value: "−100.00" });
  });
});

describe("overBannerText", () => {
  it("says Everyday overspend comes out of Safe to spend", () => {
    expect(overBannerText("everyday", 17_500, "AED")).toBe(
      "Over by AED 175. It's coming out of your Safe to spend.",
    );
    expect(overBannerText("bills", 17_500, "AED")).toBe(
      "Over by AED 175. Cover it to keep your plan honest.",
    );
  });
});

describe("spendingListTitle", () => {
  it("counts the rows once every page is in", () => {
    expect(spendingListTitle(9, true)).toBe("THIS MONTH · 9");
    expect(spendingListTitle(50, false)).toBe("THIS MONTH");
  });
});
