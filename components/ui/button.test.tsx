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

  it("uses Kumo's primary emphasis treatment and interaction state", () => {
    const { UNSAFE_getByType } = render(
      <Button>
        <Text>Add domain</Text>
      </Button>,
    );

    const gradient = UNSAFE_getByType(LinearGradient);
    const button = screen.getByRole("button");

    expect(button.props.className).toContain("h-9");
    expect(button.props.className).toContain("gap-1.5");
    expect(button.props.className).toContain("rounded-lg");
    expect(button.props.className).toContain("px-3");
    expect(button.props.className).toContain("shadow-xs");
    expect(button.props.className).toContain("ring-[#045ede]");
    expect(gradient.props.colors).toEqual(["#3c86ff", "#056dff"]);
    expect(gradient.props.start).toEqual({ x: 0, y: 0 });
    expect(gradient.props.end).toEqual({ x: 0, y: 1 });
    expect(gradient.props.style).toEqual({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });

    fireEvent(button, "hoverIn");

    expect(UNSAFE_getByType(LinearGradient).props.colors).toEqual(["#619eff", "#056dff"]);
  });
});
