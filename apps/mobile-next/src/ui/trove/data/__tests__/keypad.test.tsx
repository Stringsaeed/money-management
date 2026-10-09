import { useState } from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { Keypad } from "../keypad";

function Harness({
  initial = "",
  ...props
}: { initial?: string } & Partial<Parameters<typeof Keypad>[0]>) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Keypad decimalSeparator="." {...props} onChange={setValue} value={value} />
      <Echo value={value} />
    </>
  );
}

const Echo = ({ value }: { value: string }) => <Text testID="echo">{value}</Text>;

const tap = (label: string) => fireEvent.press(screen.getByLabelText(label));

describe("Keypad", () => {
  it("labels every key", async () => {
    await render(<Harness />);
    for (const label of [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "Decimal point",
      "Delete",
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("types digits, one decimal point, and deletes", async () => {
    await render(<Harness />);
    await tap("1");
    await tap("2");
    await tap("Decimal point");
    await tap("Decimal point");
    await tap("5");
    expect(screen.getByTestId("echo").props.children).toBe("12.5");
    await tap("Delete");
    await tap("Delete");
    expect(screen.getByTestId("echo").props.children).toBe("12");
  });

  it("stops at two fraction digits", async () => {
    await render(<Harness initial="1.25" />);
    await tap("9");
    expect(screen.getByTestId("echo").props.children).toBe("1.25");
  });

  it("only reports presses that change the value", async () => {
    const onChange = jest.fn();
    await render(<Keypad decimalSeparator="." onChange={onChange} value="" />);
    await tap("Delete");
    expect(onChange).not.toHaveBeenCalled();
    await tap("4");
    expect(onChange).toHaveBeenCalledWith("4");
  });

  it("draws the locale decimal separator on the key", async () => {
    await render(<Harness decimalSeparator="," />);
    expect(screen.getByText(",")).toBeTruthy();
  });

  it("hides the decimal key when no fraction digits are allowed", async () => {
    await render(<Harness maxFractionDigits={0} />);
    expect(screen.queryByLabelText("Decimal point")).toBeNull();
    expect(screen.getByLabelText("0")).toBeTruthy();
  });

  it("taps a light haptic on iOS", async () => {
    const previous = process.env.EXPO_OS;
    process.env.EXPO_OS = "ios";
    const impact = jest.spyOn(Haptics, "impactAsync").mockResolvedValue(undefined);
    await render(<Harness />);
    await tap("3");
    expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    impact.mockRestore();
    process.env.EXPO_OS = previous;
  });
});
