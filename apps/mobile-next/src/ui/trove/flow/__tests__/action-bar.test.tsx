import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ActionBar } from "../action-bar";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderBar = (ui: ReactElement) =>
  render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);

describe("ActionBar", () => {
  it("reads the summary as one label and presses the primary", async () => {
    const onPress = jest.fn();
    await renderBar(
      <ActionBar
        primary={{ label: "Next", onPress }}
        summary={{ label: "MONEY TO PLAN", value: "AED 14,200" }}
      />,
    );
    expect(screen.getByLabelText("MONEY TO PLAN: AED 14,200")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("pads the bottom to the home-indicator inset", async () => {
    await renderBar(<ActionBar primary={{ label: "Next", onPress: jest.fn() }} testID="bar" />);
    expect(screen.getByTestId("bar")).toHaveStyle({ paddingBottom: 34 });
  });

  it("keeps a 14pt bottom without the safe area", async () => {
    await renderBar(
      <ActionBar primary={{ label: "Next", onPress: jest.fn() }} safeArea={false} testID="bar" />,
    );
    expect(screen.getByTestId("bar")).toHaveStyle({ paddingBottom: 14 });
  });

  it("pairs an outline secondary with a negative primary", async () => {
    const onMove = jest.fn();
    const onCover = jest.fn();
    await renderBar(
      <ActionBar
        primary={{ label: "Cover AED 175", onPress: onCover, tone: "negative" }}
        secondary={{ label: "Move money", onPress: onMove }}
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Move money" }));
    await fireEvent.press(screen.getByRole("button", { name: "Cover AED 175" }));
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onCover).toHaveBeenCalledTimes(1);
  });

  it("blocks a disabled or loading primary", async () => {
    const onPress = jest.fn();
    await renderBar(
      <ActionBar
        note="You can change any of this later."
        primary={{ label: "Review", onPress, disabled: true }}
      />,
    );
    expect(screen.getByText("You can change any of this later.")).toBeTruthy();
    const button = screen.getByRole("button", { name: "Review" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("marks a loading primary busy", async () => {
    await renderBar(
      <ActionBar
        caption="Only money you have. Expected income never counts."
        primary={{ label: "Plan my month", onPress: jest.fn(), loading: true }}
      />,
    );
    expect(screen.getByText("Only money you have. Expected income never counts.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Plan my month" }).props.accessibilityState,
    ).toMatchObject({ busy: true, disabled: true });
  });
});
