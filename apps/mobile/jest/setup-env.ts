/* eslint-disable @typescript-eslint/no-require-imports */
// oxlint-disable typescript/no-require-imports
// oxlint-disable anti-slop/no-module-mocking -- Jest setup owns native dependency boundaries.
import { notifyManager } from "@tanstack/query-core";
import { act } from "@testing-library/react-native";

import { useUIStore } from "@/stores/ui-store";

jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock("@op-engineering/op-sqlite", () => ({
  open: jest.fn(),
  openAsync: jest.fn(),
}));

// better-auth's Expo client ships untranspiled ESM and talks to the network —
// tests get an inert signed-out client instead.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: jest.fn(() => ({ data: null, isPending: true })),
    getSession: jest.fn(async () => ({ data: null })),
    signOut: jest.fn(async () => undefined),
    getCookie: jest.fn(() => ""),
    magicLink: { verify: jest.fn() },
    signIn: { magicLink: jest.fn(), email: jest.fn() },
    signUp: { email: jest.fn() },
    resetPassword: jest.fn(),
    requestPasswordReset: jest.fn(),
  },
}));

jest.mock("@/modules/access", () => ({
  useAccess: jest.fn(() => ({
    kind: "anonymous" as const,
    beginAuth: jest.fn(),
  })),
  AccessProvider: ({ children }: { children: React.ReactNode }) => children,
  AuthLinkGate: () => null,
  signedInUserId: (access: { kind: string; user?: { userId: string } }) =>
    access.kind === "signed_in" ? (access.user?.userId ?? null) : null,
  getAuthCookie: jest.fn(() => ""),
  HOUSEHOLDS_KEY: ["households"],
  PROFILE_HOUSEHOLD_HREF: "/(tabs)/settings/household",
  returnTo: {
    profileHousehold: () => ({ kind: "profile_household" }),
    current: () => ({ kind: "profile_household" }),
    parse: (raw?: string) =>
      raw === "/(tabs)" || raw === "/(tabs)/settings"
        ? { kind: "screen", href: raw }
        : { kind: "profile_household" },
  },
  selectLedgerSourceForAccess: () => ({ kind: "local" }),
  coreFromAccess: (access: { kind: string }) => access,
  firstRouteParam: (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value,
}));

// The oRPC link ships untranspiled ESM and would hit the dev server — tests
// stub the household procedures instead.
jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    households: {
      listMine: jest.fn(async () => []),
      get: jest.fn(),
      create: jest.fn(),
      rename: jest.fn(),
      setActive: jest.fn(),
      generateInvite: jest.fn(),
      listInvites: jest.fn(),
      revokeInvite: jest.fn(),
      acceptInvite: jest.fn(),
      leave: jest.fn(),
      removeMember: jest.fn(),
      transferOwnership: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("react-native-keyboard-controller", () => {
  const React = require("react");
  return {
    KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
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
