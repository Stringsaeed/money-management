/* eslint-disable @typescript-eslint/no-require-imports */
// oxlint-disable typescript/no-require-imports
// oxlint-disable anti-slop/no-module-mocking -- Jest setup owns native dependency boundaries.
import type { ReactNode } from "react";
import { notifyManager } from "@tanstack/query-core";
import { act } from "@testing-library/react-native";

import { useUIStore } from "@/stores/ui-store";
import { useBannerDismissStore } from "@/stores/banner-dismiss-store";
import { useSyncModeStore } from "@/stores/sync-mode-store";

process.env.EXPO_PUBLIC_SERVER_URL ??= "http://localhost:3000";
process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ??= "client_test_jest";
process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI ??= "trove://callback";

Object.assign(globalThis.localStorage, {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
});

jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock("@op-engineering/op-sqlite", () => ({
  open: jest.fn(),
  openAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: async (_algorithm: string, value: string) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  },
  randomUUID: jest.fn(() => crypto.randomUUID()),
}));

// WorkOS AuthKit uses SecureStore + WebBrowser; tests get an inert signed-out client.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(async () => ({ type: "cancel" })),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: jest.fn(() => ({ data: null, isPending: true })),
    getSession: jest.fn(async () => ({ data: null })),
    signOut: jest.fn(async () => undefined),
    getCookie: jest.fn(() => ""),
    getAccessToken: jest.fn(async () => null),
    signInWithAuthKit: jest.fn(async () => ({ kind: "cancelled" })),
  },
  useSession: jest.fn(() => ({ data: null, isPending: true })),
  getSession: jest.fn(async () => ({ data: null })),
  signOut: jest.fn(async () => undefined),
  getCookie: jest.fn(() => ""),
  getAccessToken: jest.fn(async () => null),
  signInWithAuthKit: jest.fn(async () => ({ kind: "cancelled" })),
}));

jest.mock("@/modules/access", () => ({
  useAccess: jest.fn(() => ({
    kind: "anonymous" as const,
    beginAuth: jest.fn(),
  })),
  AccessProvider: ({ children }: { children: React.ReactNode }) => children,
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
      invite: jest.fn(),
      setMemberRole: jest.fn(),
      removeMember: jest.fn(),
      leave: jest.fn(),
      delete: jest.fn(),
      widgetHandoff: jest.fn(),
    },
  },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("react-native-keyboard-controller", () => {
  return {
    KeyboardProvider: ({ children }: { children: ReactNode }) => children,
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

jest.mock("@/lib/sonner", () => {
  const toast = Object.assign(
    jest.fn(() => "toast-id"),
    {
      success: jest.fn(() => "toast-id"),
      info: jest.fn(() => "toast-id"),
      error: jest.fn(() => "toast-id"),
      warning: jest.fn(() => "toast-id"),
      custom: jest.fn(() => "toast-id"),
      promise: jest.fn(() => "toast-id"),
      loading: jest.fn(() => "toast-id"),
      dismiss: jest.fn(),
      wiggle: jest.fn(),
    },
  );
  return { toast, Toaster: () => null };
});

jest.mock("sonner-native", () => jest.requireMock("@/lib/sonner"));
jest.mock("sonner", () => jest.requireMock("@/lib/sonner"));

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
const initialBannerDismissState = useBannerDismissStore.getState();
const initialSyncModeState = useSyncModeStore.getState();

afterEach(async () => {
  await act(() => {
    useUIStore.setState(initialUIStoreState, true);
    useBannerDismissStore.setState(initialBannerDismissState, true);
    useSyncModeStore.setState(initialSyncModeState, true);
  });
  jest.clearAllMocks();
  jest.useRealTimers();
});
