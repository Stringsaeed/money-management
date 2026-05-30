/* eslint-disable @typescript-eslint/no-require-imports */
// oxlint-disable typescript/no-require-imports
import { notifyManager } from "@tanstack/query-core";
import { act } from "@testing-library/react-native";

import { useUIStore } from "@/stores/ui-store";

jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

jest.mock("expo-router/react-navigation", () => ({
  DarkTheme: { dark: true },
  DefaultTheme: { dark: false },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useHeaderHeight: () => 0,
}));

jest.mock("react-native-nitro-fetch", () => ({
  fetch: global.fetch,
}));

jest.mock("@expo/ui/swift-ui", () => {
  const { Text, View } = require("react-native");

  return {
    ColorPicker: View,
    Host: View,
    Picker: View,
    Text,
  };
});

jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  Animation: {
    spring: jest.fn((config) => config),
  },
  animation: jest.fn(),
  contentTransition: jest.fn(),
  font: jest.fn(),
  frame: jest.fn(),
  monospacedDigit: jest.fn(),
  pickerStyle: jest.fn(),
  tag: jest.fn(),
}));

jest.mock("@tanstack/devtools-event-client", () => ({
  EventClient: class {
    emit() {}
    on() {
      return () => {};
    }
  },
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const mock = require("@gorhom/bottom-sheet/mock");

  const BottomSheetHandle = ({ children }: { children?: React.ReactNode }) => children ?? null;
  const BottomSheetFooter = ({ children }: { children?: React.ReactNode }) => children ?? null;

  return {
    ...mock,
    BottomSheetHandle,
    BottomSheetFooter,
  };
});

jest.mock("@swmansion/react-native-bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    BottomSheetProvider: Passthrough,
    ModalBottomSheet: Passthrough,
  };
});
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));
jest.mock("react-native-reanimated", () => {
  const reanimated = require("react-native-reanimated/mock");

  reanimated.default.call = () => {};

  return reanimated;
});

require("react-native-reanimated").setUpTests();

notifyManager.setNotifyFunction((callback) => {
  act(() => {
    callback();
  });
});
notifyManager.setScheduler((callback) => {
  callback();
});

const initialUIStoreState = useUIStore.getState();

afterEach(() => {
  act(() => {
    useUIStore.setState(initialUIStoreState, true);
  });
  jest.clearAllMocks();
  jest.useRealTimers();
});
