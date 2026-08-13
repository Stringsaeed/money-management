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

jest.mock("@tanstack/devtools-event-client", () => ({
  EventClient: class {
    emit() {
      // No devtools listener under Jest.
    }
    on() {
      return () => {
        // Unsubscribe is a no-op.
      };
    }
  },
}));

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
// Reanimated 4 runs its own JS implementation under Jest, so we use the real
// module and let setUpTests() register matchers, as recommended in the docs:
// https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/
// (The legacy `react-native-reanimated/mock` ships incomplete stubs — e.g.
// makeMutable is the identity fn and isSharedValue is missing.) The underlying
// Worklets runtime has no native part under Jest, so that one is mocked.
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));

require("react-native-reanimated").setUpTests();

// RNTL v14's `act` is always async, so it cannot wrap the synchronous notify
// callback. Notify directly instead — `render`, `fireEvent` and `waitFor` are
// async in v14 and flush query notifications inside their own act scope.
notifyManager.setNotifyFunction((callback) => {
  callback();
});
notifyManager.setScheduler((callback) => {
  callback();
});

const initialUIStoreState = useUIStore.getState();

afterEach(async () => {
  await act(() => {
    useUIStore.setState(initialUIStoreState, true);
  });
  jest.clearAllMocks();
  jest.useRealTimers();
});
