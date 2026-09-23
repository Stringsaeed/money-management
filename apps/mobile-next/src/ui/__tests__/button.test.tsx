import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { Button } from "../button";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "../motion";

describe("Aqua button interaction", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["primary", "secondary", "ghost", "destructive"] as const)(
    "preserves the %s action and accessible name",
    async (variant) => {
      const onPress = jest.fn();
      await render(<Button onPress={onPress} title="Save changes" variant={variant} />);

      await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { disabled: true, loading: false },
    { disabled: false, loading: true },
  ])("blocks the action with states %j", async (state) => {
    const onPress = jest.fn();
    await render(<Button {...state} onPress={onPress} title="Save changes" />);

    const button = screen.getByRole("button", { name: "Save changes" });
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toEqual({ busy: state.loading, disabled: true });
  });

  it("restores the same action after loading finishes", async () => {
    const onPress = jest.fn();
    const result = await render(<Button loading onPress={onPress} title="Save changes" />);

    expect(screen.queryByText("Save changes")).toBeNull();
    await result.rerender(<Button loading={false} onPress={onPress} title="Save changes" />);
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Save changes")).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disables button transitions when reduced motion is enabled", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const { result } = await renderHook(useReducedMotion);
    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(motionTransition(result.current, PRESS_TRANSITION)).toEqual({ type: "none" });
  });
});
