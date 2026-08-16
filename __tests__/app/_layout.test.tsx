import { render, screen, waitFor } from "@testing-library/react-native";

import RootLayout from "@/app/_layout";

const mockMarkDatabaseReset = jest.fn();
const mockMigrateRecurringRules = jest.fn();
const mockResetDatabaseIfNeeded = jest.fn();
const mockRunMigrations = jest.fn();
const mockSeedDatabase = jest.fn();
const mockUseFonts = jest.requireMock("expo-font").useFonts as jest.Mock;
const mockHideAsync = jest.requireMock("expo-splash-screen").hideAsync as jest.Mock;
const mockStackScreen = jest.fn((_: unknown) => null);
let capturedOnInit: ((database: unknown) => Promise<void>) | undefined;

jest.mock("expo-router/react-navigation", () => ({
  DarkTheme: { dark: true },
  DefaultTheme: { dark: false },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) =>
      (() => {
        const React = require("react");
        const { Fragment, createElement } = React;
        const { Text } = require("react-native");

        return createElement(Fragment, null, createElement(Text, null, "stack-ready"), children);
      })(),
    {
      Screen: (props: unknown) => mockStackScreen(props),
    },
  ),
}));

jest.mock("expo-sqlite", () => ({
  SQLiteProvider: ({
    children,
    onInit,
  }: {
    children: React.ReactNode;
    onInit: (database: unknown) => Promise<void>;
  }) => {
    capturedOnInit = onInit;
    return children;
  },
}));

jest.mock("drizzle-orm/expo-sqlite", () => ({
  drizzle: () => "drizzle-database",
}));

jest.mock("@rn-primitives/portal", () => ({
  PortalHost: () => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, "portal-host");
  },
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, "status-bar");
  },
}));

jest.mock("react-native-gesture-handler", () => ({
  ...jest.requireActual("react-native-gesture-handler"),
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/db/migrate", () => ({
  runMigrations: (...args: unknown[]) => mockRunMigrations(...args),
}));

jest.mock("@/db/seed", () => ({
  seedDatabase: (...args: unknown[]) => mockSeedDatabase(...args),
}));

jest.mock("@/db/reset", () => ({
  markDatabaseReset: (...args: unknown[]) => mockMarkDatabaseReset(...args),
  resetDatabaseIfNeeded: (...args: unknown[]) => mockResetDatabaseIfNeeded(...args),
}));

jest.mock("@/db/recurring-rules-migration", () => ({
  migrateRecurringRules: (...args: unknown[]) => mockMigrateRecurringRules(...args),
}));

jest.mock("@/modules/recurring-rules/clock", () => ({
  getSystemTimeZone: () => "Asia/Dubai",
  localDateInTimeZone: () => "2026-08-17",
}));

jest.mock("@/modules/recurring-rules/provider", () => ({
  RecurringRulesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/recurring/recurring-settlement-provider", () => ({
  RecurringSettlementProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/recurring/recurring-settlement-banner", () => ({
  RecurringSettlementBanner: () => null,
}));

describe("app/_layout", () => {
  beforeEach(() => {
    mockMarkDatabaseReset.mockReset();
    mockMigrateRecurringRules.mockReset();
    mockResetDatabaseIfNeeded.mockReset().mockResolvedValue(false);
    mockRunMigrations.mockReset().mockResolvedValue(undefined);
    mockSeedDatabase.mockReset().mockResolvedValue(undefined);
  });

  it("renders the loading fallback before fonts are ready", async () => {
    mockUseFonts.mockReturnValue([false, null]);

    await render(<RootLayout />);

    expect(screen.queryByText("stack-ready")).not.toBeOnTheScreen();
  });

  it("renders the provider tree and hides the splash screen once fonts load", async () => {
    mockUseFonts.mockReturnValue([true, null]);

    await render(<RootLayout />);

    expect(screen.getByText("stack-ready")).toBeOnTheScreen();
    expect(screen.getByText("portal-host")).toBeOnTheScreen();
    expect(screen.getByText("status-bar")).toBeOnTheScreen();
    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalled();
    });

    expect(mockStackScreen).toHaveBeenCalled();
  });

  it("migrates Recurring Rules before seeding and exposing the app", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    const database = { name: "money.db" };

    await render(<RootLayout />);
    await capturedOnInit?.(database);

    expect(mockRunMigrations).toHaveBeenCalledWith("drizzle-database");
    expect(mockMigrateRecurringRules).toHaveBeenCalledWith(
      database,
      expect.objectContaining({ timeZone: "Asia/Dubai", localDate: "2026-08-17" }),
    );
    expect(mockSeedDatabase).toHaveBeenCalledWith("drizzle-database");
    expect(mockRunMigrations.mock.invocationCallOrder[0]).toBeLessThan(
      mockMigrateRecurringRules.mock.invocationCallOrder[0]!,
    );
    expect(mockMigrateRecurringRules.mock.invocationCallOrder[0]).toBeLessThan(
      mockSeedDatabase.mock.invocationCallOrder[0]!,
    );
  });
});
