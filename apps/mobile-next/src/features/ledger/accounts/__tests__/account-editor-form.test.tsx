import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccountEditorForm } from "../account-editor-form";
import { fitEntryToPrecision, normalizeEntry } from "../account-entry";

describe("opening balance entry helpers", () => {
  it("drops a dangling decimal point and defaults an empty entry to zero", () => {
    expect(normalizeEntry("12.")).toBe("12");
    expect(normalizeEntry("")).toBe("0");
  });

  it("trims fraction digits a currency cannot hold", () => {
    expect(fitEntryToPrecision("12.55", 0)).toBe("12");
    expect(fitEntryToPrecision("12.55", 1)).toBe("12.5");
    expect(fitEntryToPrecision("12", 2)).toBe("12");
  });
});

describe("AccountEditorForm", () => {
  it("saves the typed balance as money owed when toggled", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<AccountEditorForm defaultCurrency="USD" onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByPlaceholderText("Name this account…"), "Visa");
    await fireEvent.press(screen.getByRole("button", { name: "1" }));
    await fireEvent.press(screen.getByRole("button", { name: "2" }));
    await fireEvent.press(screen.getByRole("togglebutton", { name: "Money owed" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Visa",
      type: "checking",
      currency: "USD",
      openingBalanceMinor: -1200,
    });
  });

  it("refuses to save without a name", async () => {
    const onSubmit = jest.fn();
    await render(<AccountEditorForm defaultCurrency="USD" onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
