import { fireEvent, render, screen } from "@testing-library/react-native";

import { SettingsRow } from "@/components/settings/settings-row";

describe("SettingsRow", () => {
  it("renders row details and handles presses", async () => {
    const onPress = jest.fn();

    await render(
      <SettingsRow
        emoji="💳"
        label="Accounts"
        subtitle="2 total"
        rightLabel="2"
        testID="accounts-settings-row"
        onPress={onPress}
      />,
    );

    await fireEvent.press(screen.getByTestId("accounts-settings-row"));

    expect(screen.getByText("2 total")).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalled();
  });
});
