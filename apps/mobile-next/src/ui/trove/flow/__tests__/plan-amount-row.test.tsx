import { fireEvent, render, screen } from "@testing-library/react-native";
import { createRef } from "react";
import type { TextInput } from "react-native";

import { PlanAmountRow } from "../plan-amount-row";

describe("PlanAmountRow", () => {
  it("shows the grouped figure and names the input", async () => {
    await render(
      <PlanAmountRow
        currency="AED"
        emoji="🛒"
        hint="Last month · 1,540"
        name="Groceries"
        onChangeText={jest.fn()}
        value="1600"
      />,
    );
    expect(screen.getByText("Groceries")).toBeTruthy();
    expect(screen.getByText("Last month · 1,540")).toBeTruthy();
    expect(screen.getByText("1,600", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByLabelText("Groceries amount, AED")).toBeTruthy();
  });

  it("sanitizes typing to the currency's decimals", async () => {
    const onChangeText = jest.fn();
    await render(
      <PlanAmountRow
        currency="AED"
        emoji="🏠"
        name="Rent cheque"
        onChangeText={onChangeText}
        value=""
      />,
    );
    await fireEvent.changeText(screen.getByLabelText("Rent cheque amount, AED"), "2,500.456x");
    expect(onChangeText).toHaveBeenCalledWith("2.50");
  });

  it("shows a 0 placeholder when empty", async () => {
    await render(
      <PlanAmountRow currency="AED" emoji="🏠" name="Rent" onChangeText={jest.fn()} value="" />,
    );
    expect(screen.getByText("0", { includeHiddenElements: true })).toBeTruthy();
  });

  it("forwards focus and blur and hands out the input ref", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const ref = createRef<TextInput>();
    await render(
      <PlanAmountRow
        currency="AED"
        emoji="🛒"
        name="Groceries"
        onBlur={onBlur}
        onChangeText={jest.fn()}
        onFocus={onFocus}
        ref={ref}
        value="1600"
      />,
    );
    const input = screen.getByLabelText("Groceries amount, AED");
    await fireEvent(input, "focus");
    await fireEvent(input, "blur");
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(ref.current).not.toBeNull();
  });
});
