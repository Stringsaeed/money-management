import { Platform } from "react-native";

import { fieldBorderClassName, fieldPlaceholderColor, fieldTextStyle } from "../field-style";

describe("fieldBorderClassName", () => {
  it("prioritizes the focus ring over the error state", () => {
    expect(fieldBorderClassName({ focused: true, error: true })).toBe("border-ink");
  });

  it("falls back to a destructive border when invalid and idle", () => {
    expect(fieldBorderClassName({ focused: false, error: true })).toBe("border-destructive");
  });

  it("stays transparent when idle and valid", () => {
    expect(fieldBorderClassName({ focused: false, error: false })).toBe("border-transparent");
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
    expect(fieldPlaceholderColor("light")).toBe("#1C1B1A40");
    expect(fieldPlaceholderColor("dark")).toBe("#E8E6E340");
    expect(fieldPlaceholderColor(null)).toBe("#1C1B1A40");
  });
});
