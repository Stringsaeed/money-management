import { fireEvent, render, screen } from "@testing-library/react-native";

import { AmountInput } from "@/components/common/amount-input";

describe("AmountInput", () => {
  it("renders the current amount and emits cents on change", async () => {
    const onChangeCents = jest.fn();

    await render(<AmountInput valueCents={1099} onChangeCents={onChangeCents} currency="USD" />);

    await fireEvent.changeText(screen.getByDisplayValue("10.99"), "12.34");

    expect(onChangeCents).toHaveBeenCalledWith(1234);
  });
});
