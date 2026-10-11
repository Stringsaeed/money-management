import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { HOLD_TO_CLEAR_MS } from "../keypad-hold";
import { Keypad } from "../keypad";

const key = (label: string) => screen.getByLabelText(label);

describe("Keypad hold-to-clear", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("clears after holding delete for 600 ms and taps a medium haptic on iOS", async () => {
    const previous = process.env.EXPO_OS;
    process.env.EXPO_OS = "ios";
    const impact = jest.spyOn(Haptics, "impactAsync").mockResolvedValue(undefined);
    const onChange = jest.fn();
    const onClear = jest.fn();
    await render(
      <Keypad decimalSeparator="." onChange={onChange} onClear={onClear} value="64.2" />,
    );

    await fireEvent(key("Delete"), "pressIn");
    await act(() => jest.advanceTimersByTime(HOLD_TO_CLEAR_MS - 1));
    expect(onClear).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(1));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);

    // The release after a fired hold must not also delete a digit.
    await fireEvent(key("Delete"), "pressOut");
    await fireEvent.press(key("Delete"));
    expect(onChange).not.toHaveBeenCalled();
    impact.mockRestore();
    process.env.EXPO_OS = previous;
  });

  it("deletes one digit on a quick tap and never clears", async () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    await render(
      <Keypad decimalSeparator="." onChange={onChange} onClear={onClear} value="64.2" />,
    );

    await fireEvent(key("Delete"), "pressIn");
    await act(() => jest.advanceTimersByTime(200));
    await fireEvent(key("Delete"), "pressOut");
    await fireEvent.press(key("Delete"));
    await act(() => jest.advanceTimersByTime(HOLD_TO_CLEAR_MS));
    expect(onClear).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("64.");
  });

  it("with fill alone, a hold reports an empty entry through onChange", async () => {
    const onChange = jest.fn();
    await render(<Keypad decimalSeparator="." fill onChange={onChange} value="12" />);
    await fireEvent(key("Delete"), "pressIn");
    await act(() => jest.advanceTimersByTime(HOLD_TO_CLEAR_MS));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does nothing special when the entry is already empty", async () => {
    const onClear = jest.fn();
    await render(<Keypad decimalSeparator="." onChange={jest.fn()} onClear={onClear} value="" />);
    await fireEvent(key("Delete"), "pressIn");
    await act(() => jest.advanceTimersByTime(HOLD_TO_CLEAR_MS * 2));
    expect(onClear).not.toHaveBeenCalled();
  });

  it("offers the hold to screen readers as a hint and a longpress action", async () => {
    const onClear = jest.fn();
    await render(<Keypad decimalSeparator="." onChange={jest.fn()} onClear={onClear} value="9" />);
    expect(key("Delete").props.accessibilityHint).toBe("Hold to clear");
    await fireEvent(key("Delete"), "accessibilityAction", {
      nativeEvent: { actionName: "longpress" },
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("leaves delete a plain tap without fill or onClear", async () => {
    await render(<Keypad decimalSeparator="." onChange={jest.fn()} value="9" />);
    expect(key("Delete").props.accessibilityHint).toBeUndefined();
  });
});

describe("Keypad fill layout", () => {
  const flat = (node: { props: { style?: StyleProp<ViewStyle> } } | null | undefined) =>
    StyleSheet.flatten(node?.props.style);

  it("grid and rows flex to the available height in fill mode", async () => {
    await render(<Keypad decimalSeparator="." fill onChange={jest.fn()} value="" />);
    const row = key("1").parent?.parent;
    expect(flat(row).flex).toBe(1);
    expect(flat(row?.parent).flex).toBe(1);
  });

  it("keys flex to the row with a 48pt minimum and the key ring", async () => {
    await render(<Keypad decimalSeparator="." fill onChange={jest.fn()} value="" />);
    const style = flat(key("5"));
    expect(style.flex).toBe(1);
    expect(style.minHeight).toBe(48);
    expect(style.borderWidth).toBe(1);
    expect(style.height).toBeUndefined();
  });

  it("keeps the fixed 64pt keys without fill", async () => {
    await render(<Keypad decimalSeparator="." onChange={jest.fn()} value="" />);
    const style = flat(key("5"));
    expect(style.height).toBe(64);
    expect(style.flex).toBeUndefined();
  });
});
