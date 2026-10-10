import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Slider } from "../slider";
import {
  adjustedValue,
  crossesDetent,
  percentLabel,
  sliderFraction,
  sliderValueFromOffset,
  snapToStep,
} from "../slider-utils";

const renderSlider = (ui: ReactElement) =>
  render(<GestureHandlerRootView>{ui}</GestureHandlerRootView>);

describe("slider math", () => {
  it("maps a touch offset to a clamped, stepped value", () => {
    expect(sliderValueFromOffset(100, 200, 0, 100, 0)).toBe(50);
    expect(sliderValueFromOffset(-30, 200, 0, 100, 0)).toBe(0);
    expect(sliderValueFromOffset(400, 200, 0, 100, 0)).toBe(100);
    expect(sliderValueFromOffset(87, 200, 0, 100, 10)).toBe(40);
    expect(sliderValueFromOffset(10, 0, 0, 100, 0)).toBe(0);
  });

  it("snaps fractional steps without float noise", () => {
    expect(snapToStep(0.31, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(7, 0, 10, 5)).toBe(5);
  });

  it("reports fraction and percent", () => {
    expect(sliderFraction(60, 0, 100)).toBe(0.6);
    expect(sliderFraction(5, 0, 0)).toBe(0);
    expect(percentLabel(0.6, 0, 1)).toBe("60%");
  });

  it("steps by the step, or 10% when continuous", () => {
    expect(adjustedValue(50, 1, 0, 100, 5)).toBe(55);
    expect(adjustedValue(0.5, -1, 0, 1, 0)).toBe(0.4);
    expect(adjustedValue(100, 1, 0, 100, 0)).toBe(100);
  });

  it("ticks when reaching or crossing 0, 50 and 100%", () => {
    expect(crossesDetent(0.4, 0.6)).toBe(true);
    expect(crossesDetent(0.4, 0.5)).toBe(true);
    expect(crossesDetent(0.6, 0.5)).toBe(true);
    expect(crossesDetent(0.1, 0)).toBe(true);
    expect(crossesDetent(0.9, 1)).toBe(true);
    expect(crossesDetent(0.5, 0.6)).toBe(false);
    expect(crossesDetent(0.2, 0.3)).toBe(false);
  });
});

describe("Slider", () => {
  it("is an adjustable element carrying its value", async () => {
    await renderSlider(
      <Slider
        accessibilityLabel="Sound effects volume"
        label="Sound effects"
        onValueChange={jest.fn()}
        value={0.6}
      />,
    );
    const slider = screen.getByRole("adjustable", { name: "Sound effects volume" });
    expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 1, now: 0.6, text: "60%" });
    expect(screen.getByText("Sound effects")).toBeTruthy();
    expect(screen.getByText("60%", { includeHiddenElements: true })).toBeTruthy();
  });

  it("changes value from accessibility increment and decrement", async () => {
    const onValueChange = jest.fn();
    await renderSlider(
      <Slider
        accessibilityLabel="Volume"
        maximumValue={100}
        onValueChange={onValueChange}
        step={5}
        value={60}
      />,
    );
    const slider = screen.getByRole("adjustable", { name: "Volume" });
    await fireEvent(slider, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    await fireEvent(slider, "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
    expect(onValueChange).toHaveBeenNthCalledWith(1, 65);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 55);
  });

  it("ignores adjustments and reports disabled when disabled", async () => {
    const onValueChange = jest.fn();
    await renderSlider(
      <Slider accessibilityLabel="Volume" disabled onValueChange={onValueChange} value={0.6} />,
    );
    const slider = screen.getByRole("adjustable", { name: "Volume" });
    expect(slider.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent(slider, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("formats the value label with the caller's formatter", async () => {
    await renderSlider(
      <Slider
        accessibilityLabel="Volume"
        formatValue={(value) => `${value} dB`}
        onValueChange={jest.fn()}
        value={0.5}
      />,
    );
    expect(screen.getByRole("adjustable").props.accessibilityValue.text).toBe("0.5 dB");
  });
});
