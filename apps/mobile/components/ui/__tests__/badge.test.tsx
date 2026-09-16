import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";

import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children content", async () => {
    await render(
      <Badge>
        <Text>New</Text>
      </Badge>,
    );

    expect(screen.getByText("New")).toBeOnTheScreen();
  });

  it("renders with different variants", async () => {
    const { rerender } = await render(
      <Badge variant="default">
        <Text>Default</Text>
      </Badge>,
    );
    expect(screen.getByText("Default")).toBeOnTheScreen();

    await rerender(
      <Badge variant="secondary">
        <Text>Secondary</Text>
      </Badge>,
    );
    expect(screen.getByText("Secondary")).toBeOnTheScreen();

    await rerender(
      <Badge variant="destructive">
        <Text>Destructive</Text>
      </Badge>,
    );
    expect(screen.getByText("Destructive")).toBeOnTheScreen();

    await rerender(
      <Badge variant="outline">
        <Text>Outline</Text>
      </Badge>,
    );
    expect(screen.getByText("Outline")).toBeOnTheScreen();
  });

  it("supports accessible label via accessibilityLabel", async () => {
    await render(
      <Badge accessibilityLabel="3 notifications">
        <Text>3</Text>
      </Badge>,
    );

    expect(screen.getByLabelText("3 notifications")).toBeOnTheScreen();
  });

  it("supports asChild prop for slot composition", async () => {
    const onPress = jest.fn();

    await render(
      <Badge asChild>
        <Pressable onPress={onPress} accessibilityRole="button">
          <Text>Clickable Badge</Text>
        </Pressable>
      </Badge>,
    );

    const badge = screen.getByRole("button");
    expect(badge).toBeOnTheScreen();

    await fireEvent.press(badge);
    expect(onPress).toHaveBeenCalled();
  });

  it("passes through additional view props", async () => {
    await render(
      <Badge testID="custom-badge">
        <Text>Content</Text>
      </Badge>,
    );

    expect(screen.getByTestId("custom-badge")).toBeOnTheScreen();
  });
});
