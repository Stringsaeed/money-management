import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Toast } from "../toast";
import { ToastHost } from "../toast-host";
import { getToast, hideToast, showToast } from "../toast-store";
import { resolveToastAction, shouldDismissOnSwipe, splitEmphasis, toastDuration } from "../utils";

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

const HIDDEN = { includeHiddenElements: true } as const;

describe("Toast emoji", () => {
  it("renders a decorative emoji tile before the message", async () => {
    await render(<Toast emoji="✨" message="Filed under Groceries" />);
    const tile = screen.getByTestId("toast-emoji-tile", HIDDEN);
    expect(tile.props.accessibilityElementsHidden).toBe(true);
    expect(tile.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(screen.getByText("✨", HIDDEN)).toBeTruthy();
    expect(screen.getByText("Filed under Groceries")).toBeTruthy();
  });

  it("swaps the check icon for the emoji tile", async () => {
    await render(<Toast message="Saved" />);
    expect(screen.queryByTestId("toast-emoji-tile")).toBeNull();
  });

  it("bolds the emphasised fragment", async () => {
    await render(<Toast emoji="✨" emphasis="Groceries" message="Filed under Groceries" />);
    expect(screen.getByText("Groceries")).toBeTruthy();
    expect(screen.getByText("Filed under Groceries")).toBeTruthy();
  });

  it("accepts the board's action object and runs it", async () => {
    const onPress = jest.fn();
    await render(<Toast action={{ label: "Change", onPress }} emoji="✨" message="Filed" />);
    await fireEvent.press(screen.getByRole("button", { name: "Change" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows emoji and action through the host", async () => {
    const onPress = jest.fn();
    await renderHost();
    await act(async () =>
      showToast({
        action: { label: "Change", onPress },
        emoji: "✨",
        message: "Filed under Groceries",
      }),
    );
    expect(screen.getByText("✨", HIDDEN)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Change" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Filed under Groceries")).toBeNull();
    hideToast();
  });
});

describe("toast text helpers", () => {
  it("splits around the first match", () => {
    expect(splitEmphasis("Filed under Groceries today", "Groceries")).toEqual([
      { text: "Filed under ", bold: false },
      { text: "Groceries", bold: true },
      { text: " today", bold: false },
    ]);
  });

  it("leaves the message whole without a match", () => {
    expect(splitEmphasis("Saved", "Nope")).toEqual([{ text: "Saved", bold: false }]);
    expect(splitEmphasis("Saved")).toEqual([{ text: "Saved", bold: false }]);
  });

  it("prefers the action object over the legacy pair", () => {
    const onPress = jest.fn();
    expect(
      resolveToastAction({ action: { label: "A", onPress }, actionLabel: "B", onAction: jest.fn() })
        ?.label,
    ).toBe("A");
    expect(resolveToastAction({ actionLabel: "B" })).toBeUndefined();
  });
});
