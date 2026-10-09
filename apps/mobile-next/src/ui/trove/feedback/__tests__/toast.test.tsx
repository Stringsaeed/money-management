import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Toast } from "../toast";
import { ToastHost } from "../toast-host";
import { getToast, hideToast, showToast } from "../toast-store";
import { shouldDismissOnSwipe, toastDuration } from "../utils";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderHost = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ToastHost bottomOffset={64} />
    </SafeAreaProvider>,
  );

describe("toast store timing", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    hideToast();
    jest.useRealTimers();
  });

  it("dismisses a plain toast after 4 s", () => {
    showToast({ message: "Saved" });
    jest.advanceTimersByTime(3999);
    expect(getToast()?.message).toBe("Saved");
    jest.advanceTimersByTime(1);
    expect(getToast()).toBeNull();
  });

  it("keeps a toast with an action for 6 s", () => {
    showToast({ actionLabel: "Undo", message: "Moved $250", onAction: jest.fn() });
    jest.advanceTimersByTime(5999);
    expect(getToast()).not.toBeNull();
    jest.advanceTimersByTime(1);
    expect(getToast()).toBeNull();
  });

  it("replaces the current toast and restarts the clock", () => {
    showToast({ message: "First" });
    jest.advanceTimersByTime(3000);
    showToast({ message: "Second" });
    jest.advanceTimersByTime(3000);
    expect(getToast()?.message).toBe("Second");
    jest.advanceTimersByTime(1000);
    expect(getToast()).toBeNull();
  });
});

describe("ToastHost", () => {
  afterEach(() => hideToast());

  it("renders the current toast and hides it after the action runs", async () => {
    const onAction = jest.fn();
    await renderHost();
    expect(screen.queryByText("Moved $250")).toBeNull();

    await act(async () => showToast({ actionLabel: "Undo", message: "Moved $250", onAction }));
    expect(screen.getByText("Moved $250")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Undo" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Moved $250")).toBeNull();
  });
});

describe("Toast", () => {
  it("shows no action button without a handler", async () => {
    await render(<Toast actionLabel="Undo" message="Saved" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("toast helpers", () => {
  it("picks 4 s or 6 s", () => {
    expect(toastDuration(false)).toBe(4000);
    expect(toastDuration(true)).toBe(6000);
  });

  it("dismisses on a long drag or a fast downward flick only", () => {
    expect(shouldDismissOnSwipe(60, 0)).toBe(true);
    expect(shouldDismissOnSwipe(10, 1)).toBe(true);
    expect(shouldDismissOnSwipe(10, 0.1)).toBe(false);
    expect(shouldDismissOnSwipe(-10, 1)).toBe(false);
  });
});
