import { Platform } from "react-native";

import { colors, rawColorValues } from "@/lib/design-tokens";

import { fieldBorderColor, fieldPlaceholderColor, fieldTextStyle } from "../field-style";

describe("fieldBorderColor", () => {
  it("prioritizes the focus ring over the error state", () => {
    expect(fieldBorderColor({ focused: true, error: true })).toBe(colors.ink);
  });

  it("falls back to a destructive border when invalid and idle", () => {
    expect(fieldBorderColor({ focused: false, error: true })).toBe(colors.destructive);
  });

  it("stays transparent when idle and valid", () => {
    expect(fieldBorderColor({ focused: false, error: false })).toBe("transparent");
  });
});

describe("fieldTextStyle", () => {
  it("applies Paper Ledger body medium typography at 15/20 with ink color", () => {
    const style = fieldTextStyle("#1C1B1A");

    expect(style.fontSize).toBe(15);
    expect(style.lineHeight).toBe(20);
    expect(style.color).toBe("#1C1B1A");
    expect(style.fontFamily).toBe(Platform.OS === "ios" ? "Nunito-Medium" : "Nunito_500Medium");
  });
});

describe("fieldPlaceholderColor", () => {
  it("uses the muted ink token for light and dark schemes", () => {
    expect(fieldPlaceholderColor("light")).toBe(`${rawColorValues.light.ink}40`);
    expect(fieldPlaceholderColor("dark")).toBe(`${rawColorValues.dark.ink}40`);
    expect(fieldPlaceholderColor(null)).toBe(`${rawColorValues.light.ink}40`);
  });
});
