import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with accessible button role", async () => {
    await render(
      <Button>
        <Text>Save</Text>
      </Button>,
    );

    expect(screen.getByRole("button")).toBeOnTheScreen();
  });

  it("renders button content and handles presses", async () => {
    const onPress = jest.fn();

    await render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );

    await fireEvent.press(screen.getByRole("button"));

    expect(screen.getByText("Save")).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalled();
  });

  it("renders with different variants", async () => {
    const { rerender } = await render(
      <Button variant="default">
        <Text>Default</Text>
      </Button>,
    );
    expect(screen.getByText("Default")).toBeOnTheScreen();

    await rerender(
      <Button variant="destructive">
        <Text>Destructive</Text>
      </Button>,
    );
    expect(screen.getByText("Destructive")).toBeOnTheScreen();

    await rerender(
      <Button variant="outline">
        <Text>Outline</Text>
      </Button>,
    );
    expect(screen.getByText("Outline")).toBeOnTheScreen();

    await rerender(
      <Button variant="ghost">
        <Text>Ghost</Text>
      </Button>,
    );
    expect(screen.getByText("Ghost")).toBeOnTheScreen();

    await rerender(
      <Button variant="link">
        <Text>Link</Text>
      </Button>,
    );
    expect(screen.getByText("Link")).toBeOnTheScreen();
  });

  it("renders with different sizes", async () => {
    const { rerender } = await render(
      <Button size="sm">
        <Text>Small</Text>
      </Button>,
    );
    expect(screen.getByText("Small")).toBeOnTheScreen();

    await rerender(
      <Button size="lg">
        <Text>Large</Text>
      </Button>,
    );
    expect(screen.getByText("Large")).toBeOnTheScreen();

    await rerender(
      <Button size="xl">
        <Text>Extra Large</Text>
      </Button>,
    );
    expect(screen.getByText("Extra Large")).toBeOnTheScreen();

    await rerender(
      <Button size="icon">
        <Text>🔍</Text>
      </Button>,
    );
    expect(screen.getByText("🔍")).toBeOnTheScreen();
  });

  it("respects disabled state", async () => {
    const onPress = jest.fn();

    await render(
      <Button disabled onPress={onPress}>
        <Text>Disabled</Text>
      </Button>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeOnTheScreen();

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
