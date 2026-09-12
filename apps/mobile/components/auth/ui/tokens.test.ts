import { Platform } from "react-native";

import { AUTH_FALLBACK_PALETTE, AUTH_FONT_FACES, fontFace, normalizeColor } from "./tokens";

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

describe("fontFace", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("selects the ios face when Platform.select resolves ios", () => {
    jest.spyOn(Platform, "select").mockImplementation((spec) => {
      const faces = spec as { ios?: string; android?: string; default?: string };
      return faces.ios ?? faces.default;
    });

    expect(fontFace("400")).toBe(AUTH_FONT_FACES["400"].ios);
    expect(fontFace("500")).toBe(AUTH_FONT_FACES["500"].ios);
    expect(fontFace("600")).toBe(AUTH_FONT_FACES["600"].ios);
  });

  it("selects android faces on android and web faces via the default branch", () => {
    const select = jest.spyOn(Platform, "select");
    select.mockImplementation((spec) => {
      const faces = spec as { ios?: string; android?: string; default?: string };
      return faces.android ?? faces.default;
    });
    expect(fontFace("400")).toBe(AUTH_FONT_FACES["400"].android);
    expect(fontFace("600")).toBe(AUTH_FONT_FACES["600"].android);

    select.mockImplementation((spec) => {
      const faces = spec as { ios?: string; android?: string; default?: string };
      return faces.default;
    });
    expect(fontFace("400")).toBe(AUTH_FONT_FACES["400"].web);
    expect(fontFace("500")).toBe(AUTH_FONT_FACES["500"].web);
  });
});
