import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Button } from "../button";
import { TabBar } from "../tab-bar";
import { TextField } from "../text-field";

describe("mobile-next UI foundation", () => {
  it("exposes accessible button states and invokes the action", async () => {
    const onPress = jest.fn();
    await render(<Button title="Continue" onPress={onPress} />);

    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Continue" }).props.accessibilityState).toEqual({
      disabled: false,
      busy: false,
    });
  });

  it("keeps tab navigation presentation-only and injects the create action", async () => {
    const onSelect = jest.fn();
    const onCreate = jest.fn();

    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { height: 844, width: 390, x: 0, y: 0 },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        <TabBar activeKey="home" onCreate={onCreate} onSelect={onSelect} />
      </SafeAreaProvider>,
    );

    await fireEvent.press(screen.getByLabelText("Ledger"));
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    expect(onSelect).toHaveBeenCalledWith("ledger");
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("reports field errors while preserving controlled text input", async () => {
    const onChangeText = jest.fn();
    await render(
      <TextField error="Email is required" label="Email" onChangeText={onChangeText} value="" />,
    );

    await fireEvent.changeText(screen.getByLabelText("Email"), "ada@example.com");

    expect(screen.getByText("Email is required")).toBeOnTheScreen();
    expect(onChangeText).toHaveBeenCalledWith("ada@example.com");
  });
});
