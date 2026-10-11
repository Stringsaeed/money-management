import { useColorScheme } from "react-native";

import type { ColorMode } from "../tokens";

/** The current paper/dark mode, for the few places that must pick a raw value in JS. */
export function useColorMode(): ColorMode {
  return useColorScheme() === "dark" ? "dark" : "light";
}
