import { act, renderHook } from "@testing-library/react-native";
import { usePanGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import { PILL_PADDING, TAB_WIDTH } from "../constants";
import { useTabBarPanGesture } from "../use-tab-bar-pan-gesture";

jest.mock("react-native-gesture-handler", () => ({
  ...jest.requireActual("react-native-gesture-handler"),
  usePanGesture: jest.fn((config) => config),
}));

jest.mock("react-native-reanimated", () => ({
  ...jest.requireActual("react-native-reanimated"),
  useAnimatedStyle: jest.fn((updater) => updater()),
  useSharedValue: jest.fn((value) => ({ value })),
  withTiming: jest.fn((value) => value),
}));

describe("useTabBarPanGesture", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("moves the capsule to the finger as soon as the touch begins", async () => {
    await renderHook(() =>
      useTabBarPanGesture({ focusedIndex: 0, tabCount: 4, onSelect: jest.fn() }),
    );
    const gesture = jest.mocked(usePanGesture).mock.calls[0]?.[0];
    const offset = jest.mocked(useSharedValue).mock.results[0]?.value;

    await act(() => {
      gesture?.onBegin?.({ x: PILL_PADDING + TAB_WIDTH * 2.5 } as never);
    });

    expect(offset?.value).toBe(TAB_WIDTH * 2);
  });

  it("settles on the pressed tab without flicking to the previous tab", async () => {
    await renderHook(() =>
      useTabBarPanGesture({ focusedIndex: 0, tabCount: 4, onSelect: jest.fn() }),
    );
    const gesture = jest.mocked(usePanGesture).mock.calls[0]?.[0];
    const offset = jest.mocked(useSharedValue).mock.results[0]?.value;

    await act(() => {
      gesture?.onBegin?.({ x: PILL_PADDING + TAB_WIDTH * 1.25 } as never);
      gesture?.onFinalize?.({} as never);
    });

    expect(offset?.value).toBe(TAB_WIDTH);
  });

  it("returns to the focused tab after pressing its inner edge", async () => {
    await renderHook(() =>
      useTabBarPanGesture({ focusedIndex: 1, tabCount: 4, onSelect: jest.fn() }),
    );
    const gesture = jest.mocked(usePanGesture).mock.calls[0]?.[0];
    const offset = jest.mocked(useSharedValue).mock.results[0]?.value;

    await act(() => {
      gesture?.onBegin?.({ x: PILL_PADDING + TAB_WIDTH * 1.1 } as never);
      gesture?.onFinalize?.({} as never);
    });

    expect(offset?.value).toBe(TAB_WIDTH);
  });
});
