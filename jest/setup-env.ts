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

jest.mock("react-native-nitro-fetch", () => ({
  fetch: global.fetch,
}));

jest.mock("@expo/ui/swift-ui", () => {
  const { Text, View } = require("react-native");

  return {
    Host: View,
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
}));

jest.mock("@gorhom/bottom-sheet", () => require("@gorhom/bottom-sheet/mock"));
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
