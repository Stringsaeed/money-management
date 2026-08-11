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

  it("uses Kumo's primary emphasis gradient utilities", () => {
    render(
      <Button>
        <Text>Add domain</Text>
      </Button>,
    );

    const button = screen.getByRole("button");

    expect(button.props.className).toContain("h-9");
    expect(button.props.className).toContain("gap-1.5");
    expect(button.props.className).toContain("rounded-lg");
    expect(button.props.className).toContain("px-3");
    expect(button.props.className).toContain("shadow-xs");
    expect(button.props.className).toContain("ring-[#045ede]");
    expect(button.props.className).toContain("bg-linear-to-b");
    expect(button.props.className).toContain("from-kumo-brand-emphasis-start");
    expect(button.props.className).toContain("to-kumo-brand-emphasis-end");
  });
});
