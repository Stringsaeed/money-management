import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { RadioCard } from "../radio-card";

describe("RadioCard", () => {
  it("is a checked radio named by title, sub and trailing figure", async () => {
    const onPress = jest.fn();
    await render(
      <RadioCard
        emoji="🫙"
        onPress={onPress}
        selected
        sub="AFTER: 555"
        subStyle="mono"
        subTone="accent"
        title="Not planned yet"
        trailing="730"
      />,
    );
    const card = screen.getByRole("radio", { name: "Not planned yet, AFTER: 555, 730" });
    expect(card.props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("blocks presses when disabled", async () => {
    const onPress = jest.fn();
    await render(<RadioCard disabled onPress={onPress} selected={false} title="DEWA" />);
    const card = screen.getByRole("radio", { name: "DEWA" });
    expect(card.props.accessibilityState).toMatchObject({ checked: false, disabled: true });
    await fireEvent.press(card);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders the large card with extra content", async () => {
    await render(
      <RadioCard
        emoji="🛟"
        onPress={jest.fn()}
        selected={false}
        size="lg"
        sub="Moves all 160 into a Saving-for envelope."
        title="Save it"
      >
        <Text>Emergency cushion</Text>
      </RadioCard>,
    );
    expect(screen.getByText("Save it")).toBeTruthy();
    expect(screen.getByText("Moves all 160 into a Saving-for envelope.")).toBeTruthy();
    expect(screen.getByText("Emergency cushion")).toBeTruthy();
  });
});
