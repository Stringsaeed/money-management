import { deltaPercentAccessibilityLabel, deltaToneForPercent, formatDeltaPercent } from "../delta";

describe("delta helpers", () => {
  it("picks the tone from the sign", () => {
    expect(deltaToneForPercent(2.6)).toBe("positive");
    expect(deltaToneForPercent(-1.1)).toBe("negative");
    expect(deltaToneForPercent(0)).toBe("neutral");
  });

  it("treats values that round to 0.0 as neutral", () => {
    expect(deltaToneForPercent(0.04)).toBe("neutral");
    expect(deltaToneForPercent(-0.04)).toBe("neutral");
    expect(formatDeltaPercent(-0.04)).toBe("0.0%");
  });

  it("treats non-finite input as neutral", () => {
    expect(deltaToneForPercent(Number.NaN)).toBe("neutral");
    expect(formatDeltaPercent(Number.POSITIVE_INFINITY)).toBe("0.0%");
  });

  it("formats with plus and a typographic minus", () => {
    expect(formatDeltaPercent(2.6)).toBe("+2.6%");
    expect(formatDeltaPercent(-1.1)).toBe("−1.1%");
    expect(formatDeltaPercent(0)).toBe("0.0%");
    expect(formatDeltaPercent(3)).toBe("+3.0%");
  });

  it("speaks the direction", () => {
    expect(deltaPercentAccessibilityLabel(2.6)).toBe("up 2.6 percent");
    expect(deltaPercentAccessibilityLabel(-1.1)).toBe("down 1.1 percent");
    expect(deltaPercentAccessibilityLabel(0)).toBe("no change, 0.0 percent");
  });
});
