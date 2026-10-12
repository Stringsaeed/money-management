import { fireEvent, render, screen } from "@testing-library/react-native";

import { LedgerOption } from "../ledger-option";

describe("LedgerOption", () => {
  it("is a radio that reads name, sub and safe figure", async () => {
    const onPress = jest.fn();
    await render(
      <LedgerOption
        emoji="👤"
        name="Personal"
        onPress={onPress}
        safeValue="1,988"
        selected
        sub="Just you · your own accounts"
      />,
    );
    const option = screen.getByRole("radio", {
      name: "Personal, Just you · your own accounts, SAFE 1,988",
    });
    expect(option.props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(option);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is unchecked when another ledger is active", async () => {
    await render(
      <LedgerOption
        accessibilityLabel="Household"
        emoji="🏠"
        name="Household"
        onPress={jest.fn()}
        safeValue="2,410"
        selected={false}
        sub="With Sara · shared accounts only"
      />,
    );
    expect(screen.getByRole("radio", { name: "Household" }).props.accessibilityState).toMatchObject(
      { checked: false },
    );
  });

  it("drops the SAFE column without a figure", async () => {
    await render(
      <LedgerOption
        emoji="🏠"
        name="Household"
        onPress={jest.fn()}
        selected={false}
        sub="With Sara · shared accounts only"
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Household, With Sara · shared accounts only" }),
    ).toBeTruthy();
    expect(screen.queryByText("SAFE")).toBeNull();
  });
});
