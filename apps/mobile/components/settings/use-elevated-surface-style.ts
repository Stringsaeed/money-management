import { StyleSheet, type ViewStyle } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

export function useElevatedSurfaceStyle(): Pick<
  ViewStyle,
  "borderCurve" | "boxShadow" | "borderRadius" | "borderWidth" | "borderColor"
> {
  const isDark = useColorScheme() === "dark";

  if (isDark) {
    return {
      borderCurve: "circular",
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 255, 255, 0.1)",
    };
  }

  return {
    borderCurve: "circular",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.1)",
    boxShadow: "2px 2px 0px -1.5px rgba(0, 0, 0, 0.01)",
  };
}
