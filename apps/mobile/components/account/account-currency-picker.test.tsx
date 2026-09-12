import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { FlatList } from "react-native";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";

function CurrencyPickerHarness({
  compact = true,
  initialValue = "USD",
}: {
  compact?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return <AccountCurrencyPicker compact={compact} onChange={setValue} value={value} />;
}

describe("AccountCurrencyPicker", () => {
  it("opens a searchable sheet from the compact field", async () => {
    await render(<CurrencyPickerHarness />);

    expect(screen.queryByTestId("account-currency-sheet")).toBeNull();
    expect(screen.queryByTestId("account-currency-search")).toBeNull();

    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    expect(screen.getByTestId("account-currency-sheet")).toBeOnTheScreen();
    expect(screen.getByTestId("account-currency-search")).toBeOnTheScreen();
    expect(screen.getByTestId("account-currency-option-USD")).toBeOnTheScreen();
  });

  it("filters results by ISO code", async () => {
    await render(<CurrencyPickerHarness />);
    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    await fireEvent.changeText(screen.getByTestId("account-currency-search"), "jpy");

    expect(screen.getByTestId("account-currency-option-JPY")).toBeOnTheScreen();
    expect(screen.queryByTestId("account-currency-option-EUR")).toBeNull();
  });

  it("filters results by display name", async () => {
    await render(<CurrencyPickerHarness />);
    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    await fireEvent.changeText(screen.getByTestId("account-currency-search"), "pound");

    expect(screen.getByTestId("account-currency-option-GBP")).toBeOnTheScreen();
    expect(screen.queryByTestId("account-currency-option-USD")).toBeNull();
  });

  it("shows an empty state when nothing matches", async () => {
    await render(<CurrencyPickerHarness />);
    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    await fireEvent.changeText(screen.getByTestId("account-currency-search"), "zzzz-nope");

    expect(screen.getByText(/No currencies match/i)).toBeOnTheScreen();
  });

  it("updates the form value and dismisses the sheet on selection", async () => {
    await render(<CurrencyPickerHarness />);
    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    await fireEvent.press(screen.getByTestId("account-currency-option-EUR"));

    expect(screen.queryByTestId("account-currency-sheet")).toBeNull();
    expect(screen.getByTestId("account-currency-trigger")).toHaveTextContent("EUR");
  });

  it("dismisses the sheet without changing the value", async () => {
    await render(<CurrencyPickerHarness initialValue="CAD" />);
    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    await fireEvent.press(screen.getByLabelText("Dismiss sheet"));

    expect(screen.queryByTestId("account-currency-sheet")).toBeNull();
    expect(screen.queryByTestId("account-currency-search")).toBeNull();
    expect(screen.getByTestId("account-currency-trigger")).toHaveTextContent("CAD");
  });

  it("keeps the currency sheet unmounted while closed", async () => {
    await render(<CurrencyPickerHarness />);

    expect(screen.queryByTestId("account-currency-sheet")).toBeNull();
    expect(screen.queryByTestId("account-currency-search")).toBeNull();
    expect(screen.getByTestId("account-currency-trigger")).toBeOnTheScreen();
  });

  it("announces the selected currency when reopened", async () => {
    await render(<CurrencyPickerHarness initialValue="GBP" />);
    await fireEvent.press(screen.getByTestId("account-currency-trigger"));

    const selected = screen.getByTestId("account-currency-option-GBP");
    expect(selected.props.accessibilityState?.selected).toBe(true);
    expect(selected.props.accessibilityLabel).toMatch(/GBP,/i);
  });

  it("reveals the selected tail currency when the sheet reopens", async () => {
    const scrollToIndex = jest.spyOn(FlatList.prototype, "scrollToIndex");

    try {
      await render(<CurrencyPickerHarness initialValue="MXN" />);
      await fireEvent.press(screen.getByTestId("account-currency-trigger"));

      const selected = screen.getByTestId("account-currency-option-MXN");
      expect(selected.props.accessibilityState?.selected).toBe(true);
      await waitFor(() => {
        expect(scrollToIndex).toHaveBeenCalledWith(
          expect.objectContaining({ animated: false, index: 12 }),
        );
      });
    } finally {
      scrollToIndex.mockRestore();
    }
  });
});
