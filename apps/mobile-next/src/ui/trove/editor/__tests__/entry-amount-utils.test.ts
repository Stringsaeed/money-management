import {
  entryAccessibilityLabel,
  entryLayout,
  entrySize,
  localeGroupSeparator,
} from "../entry-amount-utils";

const OPTIONS = { fractionDigits: 2, decimalSeparator: ".", groupSeparator: "," };
const text = (value: string, options = OPTIONS) =>
  entryLayout(value, options)
    .chars.map((entry) => entry.char)
    .join("");
const ghosts = (value: string) =>
  entryLayout(value, OPTIONS)
    .chars.filter((entry) => entry.kind === "ghost")
    .map((entry) => entry.char)
    .join("");

describe("entryLayout", () => {
  it("shows an empty entry as a faded 0.00", () => {
    const layout = entryLayout("", OPTIONS);
    expect(text("")).toBe("0.00");
    expect(layout.empty).toBe(true);
    expect(ghosts("")).toBe(".00");
  });

  it("fades the cents that are not typed yet", () => {
    expect(text("64")).toBe("64.00");
    expect(ghosts("64")).toBe(".00");
    expect(text("64.")).toBe("64.00");
    expect(ghosts("64.")).toBe("00");
    expect(text("64.2")).toBe("64.20");
    expect(ghosts("64.2")).toBe("0");
    expect(ghosts("64.20")).toBe("");
  });

  it("groups thousands with the given separator", () => {
    expect(text("1250000.5")).toBe("1,250,000.50");
    expect(text("1250000", { ...OPTIONS, groupSeparator: " ", decimalSeparator: "," })).toBe(
      "1 250 000,00",
    );
  });

  it("has no point or ghosts for zero-decimal currencies", () => {
    expect(text("1500", { ...OPTIONS, fractionDigits: 0 })).toBe("1,500");
  });

  it("keeps digit keys stable when a grouping mark appears", () => {
    const keys = (value: string) =>
      entryLayout(value, OPTIONS)
        .chars.filter((entry) => entry.kind === "digit")
        .map((entry) => entry.key);
    expect(keys("999")).toEqual(keys("9999").slice(0, 3));
  });

  it("marks only the typed decimal point as a point", () => {
    expect(entryLayout("1.", OPTIONS).chars.map((entry) => entry.kind)).toEqual([
      "digit",
      "point",
      "ghost",
      "ghost",
    ]);
  });
});

describe("entrySize", () => {
  it("steps 60, 44, 34 as the number grows", () => {
    expect(entrySize(4)).toBe(60);
    expect(entrySize(7)).toBe(60);
    expect(entrySize(8)).toBe(44);
    expect(entrySize(9)).toBe(44);
    expect(entrySize(10)).toBe(34);
    expect(entrySize(14)).toBe(34);
  });

  it("follows the rendered length", () => {
    expect(entryLayout("", OPTIONS).size).toBe(60);
    expect(entryLayout("1250.5", OPTIONS).size).toBe(44);
    expect(entryLayout("1250000", OPTIONS).size).toBe(34);
  });
});

describe("localeGroupSeparator", () => {
  it("reads the locale and falls back to a comma", () => {
    expect(localeGroupSeparator("en-US")).toBe(",");
    expect(localeGroupSeparator("not a locale!")).toBe(",");
  });
});

describe("entryAccessibilityLabel", () => {
  it("speaks the entered figure in full", () => {
    expect(entryAccessibilityLabel("64.2", "USD", false)).toBe("64.20 USD");
    expect(entryAccessibilityLabel("", "USD", false)).toBe("0.00 USD");
  });

  it("says minus for owed and expense amounts", () => {
    expect(entryAccessibilityLabel("64.2", "USD", true)).toBe("minus 64.20 USD");
  });

  it("does not say minus zero", () => {
    expect(entryAccessibilityLabel("", "USD", true)).toBe("0.00 USD");
  });
});
