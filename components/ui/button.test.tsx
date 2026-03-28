import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders button content and handles presses", () => {
    const onPress = jest.fn();

    render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );

    fireEvent.press(screen.getByRole("button"));

    expect(screen.getByText("Save")).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalled();
  });
});
