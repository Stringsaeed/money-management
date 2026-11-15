import { quickAddAmountLayout } from "../quick-add-amount-layout";

const options = { fractionDigits: 2, decimalSeparator: ".", groupSeparator: "," };

describe("quickAddAmountLayout", () => {
  it("shows a faded 0.00 before anything is typed", () => {
    expect(quickAddAmountLayout("", options)).toEqual({
      whole: "0",
      typedCents: "",
      ghostCents: ".00",
      empty: true,
      size: 56,
    });
  });

  it("groups the whole part and fades the cents not typed", () => {
    const layout = quickAddAmountLayout("1850", options);
    expect(layout.whole).toBe("1,850");
    expect(layout.typedCents).toBe("");
    expect(layout.ghostCents).toBe(".00");
  });

  it("keeps typed cents and fades only the rest", () => {
    const layout = quickAddAmountLayout("323.5", options);
    expect(layout.whole).toBe("323");
    expect(layout.typedCents).toBe(".5");
    expect(layout.ghostCents).toBe("0");
  });

  it("has no cents for a currency without decimals", () => {
    const layout = quickAddAmountLayout("1200", { ...options, fractionDigits: 0 });
    expect(layout.whole).toBe("1,200");
    expect(layout.typedCents + layout.ghostCents).toBe("");
  });

  it("steps the size down as the figure grows", () => {
    expect(quickAddAmountLayout("1234567", options).size).toBe(44);
    expect(quickAddAmountLayout("1234567890", options).size).toBe(34);
  });
});
