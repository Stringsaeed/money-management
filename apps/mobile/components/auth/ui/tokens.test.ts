import { AUTH_FALLBACK_PALETTE, normalizeColor } from "./tokens";

describe("normalizeColor", () => {
  const fallback = AUTH_FALLBACK_PALETTE.light["--color-ink"];

  it("keeps hex, rgb, and named colors", () => {
    expect(normalizeColor("#2c5f47", fallback)).toBe("#2c5f47");
    expect(normalizeColor("rgb(44, 95, 71)", fallback)).toBe("rgb(44, 95, 71)");
    expect(normalizeColor("rgba(44, 95, 71, 0.5)", fallback)).toBe("rgba(44, 95, 71, 0.5)");
    expect(normalizeColor("white", fallback)).toBe("white");
  });

  it("rejects CSS functions the native color parser cannot read", () => {
    expect(normalizeColor("color-mix(in oklch, white, black)", fallback)).toBe(fallback);
    expect(normalizeColor("oklch(0.5772 0.2324 260)", fallback)).toBe(fallback);
    expect(normalizeColor("var(--color-ink)", fallback)).toBe(fallback);
    expect(normalizeColor("", fallback)).toBe(fallback);
  });
});
