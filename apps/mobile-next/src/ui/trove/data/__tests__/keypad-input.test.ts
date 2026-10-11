import {
  applyKeypadKey,
  formatKeypadValue,
  keypadKeyLabel,
  keypadValueToMinor,
  localeDecimalSeparator,
  type KeypadKey,
  type KeypadLimits,
} from "../keypad-input";

const LIMITS: KeypadLimits = { maxFractionDigits: 2, maxIntegerDigits: 4 };

const press = (keys: readonly KeypadKey[], limits: KeypadLimits = LIMITS) =>
  keys.reduce((value, key) => applyKeypadKey(value, key, limits), "");

describe("applyKeypadKey", () => {
  it("appends digits", () => {
    expect(press(["1", "2", "5"])).toBe("125");
  });

  it("replaces a lone leading zero instead of stacking zeros", () => {
    expect(press(["0", "0", "7"])).toBe("7");
    expect(press(["0", "0"])).toBe("0");
  });

  it("starts a decimal from empty as 0.", () => {
    expect(press(["decimal"])).toBe("0.");
    expect(press(["decimal", "5"])).toBe("0.5");
  });

  it("ignores a second decimal point", () => {
    expect(press(["1", "decimal", "2", "decimal"])).toBe("1.2");
  });

  it("caps fraction digits", () => {
    expect(press(["1", "decimal", "2", "3", "4"])).toBe("1.23");
  });

  it("caps integer digits but still allows decimals after the cap", () => {
    expect(press(["1", "2", "3", "4", "5"])).toBe("1234");
    expect(press(["1", "2", "3", "4", "decimal", "5"])).toBe("1234.5");
  });

  it("rejects the decimal key when no fraction digits are allowed", () => {
    expect(press(["1", "decimal", "2"], { ...LIMITS, maxFractionDigits: 0 })).toBe("12");
  });

  it("backspace removes one character, down to empty", () => {
    expect(press(["1", "decimal", "5", "backspace"])).toBe("1.");
    expect(press(["1", "decimal", "5", "backspace", "backspace"])).toBe("1");
    expect(press(["7", "backspace", "backspace"])).toBe("");
  });
});

describe("localeDecimalSeparator", () => {
  it("follows the locale", () => {
    expect(localeDecimalSeparator("en-US")).toBe(".");
    expect(localeDecimalSeparator("de-DE")).toBe(",");
  });

  it("falls back to a point for an invalid locale", () => {
    expect(localeDecimalSeparator("not a locale!")).toBe(".");
  });
});

describe("formatKeypadValue", () => {
  it("swaps in the separator and shows 0 for empty", () => {
    expect(formatKeypadValue("12.5", ",")).toBe("12,5");
    expect(formatKeypadValue("0.", ",")).toBe("0,");
    expect(formatKeypadValue("", ",")).toBe("0");
  });
});

describe("keypadValueToMinor", () => {
  it("converts without float error", () => {
    expect(keypadValueToMinor("12.5", 2)).toBe(1250);
    expect(keypadValueToMinor("0.07", 2)).toBe(7);
    expect(keypadValueToMinor("19.99", 2)).toBe(1999);
    expect(keypadValueToMinor("", 2)).toBe(0);
    expect(keypadValueToMinor("0.", 2)).toBe(0);
    expect(keypadValueToMinor("1500", 0)).toBe(1500);
  });
});

describe("keypadKeyLabel", () => {
  it("names the non-digit keys", () => {
    expect(keypadKeyLabel("decimal")).toBe("Decimal point");
    expect(keypadKeyLabel("backspace")).toBe("Delete");
    expect(keypadKeyLabel("8")).toBe("8");
  });
});
