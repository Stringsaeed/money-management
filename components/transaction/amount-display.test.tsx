import { render, screen } from "@testing-library/react-native";

import { AmountDisplay } from "@/components/transaction/amount-display";

const createNumPadConfig = (value: number, isDecimal: boolean) => ({
  displayValue: value.toString(),
  value,
  isDecimal,
  decimalPlaces: isDecimal ? 2 : 0,
  appendDigit: jest.fn(),
  addDecimalPoint: jest.fn(),
  deleteDigit: jest.fn(),
  clearAll: jest.fn(),
});

describe("AmountDisplay", () => {
  it("renders the currency and zero-padded animated amount parts", async () => {
    await render(
      <AmountDisplay currencySymbol="$" numPadConfig={createNumPadConfig(12.3, true)} />,
    );

    expect(screen.getByText("$")).toBeOnTheScreen();
    expect(screen.getByText(".")).toBeOnTheScreen();
    expect(screen.getByLabelText("12")).toBeOnTheScreen();
    expect(screen.getByLabelText("30")).toBeOnTheScreen();
  });
});
