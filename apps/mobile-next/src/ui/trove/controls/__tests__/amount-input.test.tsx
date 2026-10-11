import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { AmountInput } from "../amount-input";
import {
  formatAmountDisplay,
  isQuickPickSelected,
  quickPickLabel,
  sanitizeAmountInput,
} from "../amount-input-utils";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <AmountInput
      currency="USD"
      label="Move to Emergency fund"
      onChangeText={setValue}
      quickPicks={[50, 100, 250]}
      value={value}
    />
  );
}

describe("AmountInput", () => {
  it("fills the amount from a quick pick and marks it selected", async () => {
    await render(<Harness />);
    expect(screen.getByLabelText("$250").props.accessibilityState).toMatchObject({
      selected: false,
    });
    await fireEvent.press(screen.getByLabelText("$250"));
    expect(screen.getByLabelText("Move to Emergency fund").props.value).toBe("250");
    expect(screen.getByLabelText("$250").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByLabelText("$50").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("sanitizes typing to the currency's decimals", async () => {
    await render(<Harness />);
    await fireEvent.changeText(screen.getByLabelText("Move to Emergency fund"), "12,345abc");
    expect(screen.getByLabelText("Move to Emergency fund").props.value).toBe("12.34");
  });

  it("shows a 0 placeholder when empty", async () => {
    await render(<Harness />);
    expect(screen.getByText("0", { includeHiddenElements: true })).toBeTruthy();
  });
});

describe("amount input utils", () => {
  it("strips junk, leading zeros and extra separators", async () => {
    expect(sanitizeAmountInput("007", 2)).toBe("7");
    expect(sanitizeAmountInput(".5", 2)).toBe("0.5");
    expect(sanitizeAmountInput("1.2.3", 2)).toBe("1.23");
    expect(sanitizeAmountInput("1,5", 2)).toBe("1.5");
    expect(sanitizeAmountInput("10.55", 0)).toBe("10");
  });

  it("groups the whole digits for display and keeps a trailing point", async () => {
    expect(formatAmountDisplay("12480")).toBe("12,480");
    expect(formatAmountDisplay("12480.")).toBe("12,480.");
    expect(formatAmountDisplay("0.5")).toBe("0.5");
    expect(formatAmountDisplay("")).toBe("");
  });

  it("labels quick picks with the currency sign and matches by value", async () => {
    expect(quickPickLabel(250, "USD")).toBe("$250");
    expect(quickPickLabel(250, "AED")).toBe("AED 250");
    expect(isQuickPickSelected("250.00", 250)).toBe(true);
    expect(isQuickPickSelected("", 0)).toBe(false);
  });
});
