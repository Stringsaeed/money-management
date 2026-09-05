import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NativeStackNavigationOptions } from "expo-router";

const COLORS = {
  light: { background: "#f5f5f0", foreground: "#2c5f47" },
  dark: { background: "#0f1a14", foreground: "#d6e8dc" },
};

/**
 * Shared native-stack header options for the per-tab stacks under `(tabs)`.
 * Keeps every tab's native header visually consistent with the app theme.
 */
export function useTabStackScreenOptions(): NativeStackNavigationOptions {
  const colors = useColorScheme() === "dark" ? COLORS.dark : COLORS.light;

  return {
    // headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontFamily: "Nunito_500Medium", color: colors.foreground },
    headerBackButtonDisplayMode: "minimal",
    headerTransparent: true,
  };
}
