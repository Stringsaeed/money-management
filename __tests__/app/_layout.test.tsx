import { render, screen, waitFor } from "@testing-library/react-native";

import RootLayout from "@/app/_layout";

const mockUseFonts = jest.requireMock("expo-font").useFonts as jest.Mock;
const mockHideAsync = jest.requireMock("expo-splash-screen").hideAsync as jest.Mock;
const mockStackScreen = jest.fn((_: unknown) => null);

jest.mock("@react-navigation/native", () => ({
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
  SQLiteProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
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
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/db/migrate", () => ({
  runMigrations: jest.fn(),
}));

jest.mock("@/db/seed", () => ({
  seedDatabase: jest.fn(),
}));

describe("app/_layout", () => {
  it("renders the loading fallback before fonts are ready", () => {
    mockUseFonts.mockReturnValue([false, null]);

    render(<RootLayout />);

    expect(screen.queryByText("stack-ready")).not.toBeOnTheScreen();
  });

  it("renders the provider tree and hides the splash screen once fonts load", async () => {
    mockUseFonts.mockReturnValue([true, null]);

    render(<RootLayout />);

    expect(screen.getByText("stack-ready")).toBeOnTheScreen();
    expect(screen.getByText("portal-host")).toBeOnTheScreen();
    expect(screen.getByText("status-bar")).toBeOnTheScreen();
    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalled();
    });

    expect(mockStackScreen).toHaveBeenCalled();
  });
});
