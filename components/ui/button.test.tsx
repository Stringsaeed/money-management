import { fireEvent, render, screen } from "@testing-library/react-native";
import { LinearGradient } from "expo-linear-gradient";
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

  it("uses the emphasis gradient from the design specification", () => {
    const { UNSAFE_getByType } = render(
      <Button>
        <Text>Add domain</Text>
      </Button>,
    );

    const gradient = UNSAFE_getByType(LinearGradient);

    expect(gradient.props.colors).toEqual(["#5491f6", "#005aeb"]);
    expect(gradient.props.start).toEqual({ x: 0, y: 0 });
    expect(gradient.props.end).toEqual({ x: 0, y: 1 });
    expect(gradient.props.style).toEqual({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });
  });
});
