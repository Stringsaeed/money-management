import { fireEvent, render, screen } from "@testing-library/react-native";

import { AmountInput } from "@/components/common/amount-input";

describe("AmountInput", () => {
  it("renders the current amount and emits cents on change", () => {
    const onChangeCents = jest.fn();

    render(<AmountInput valueCents={1099} onChangeCents={onChangeCents} currency="USD" />);

    fireEvent.changeText(screen.getByDisplayValue("10.99"), "12.34");

    expect(onChangeCents).toHaveBeenCalledWith(1234);
  });
});
