import type { Theme } from "expo-router";

import { useColorMode } from "../category/use-color-mode";
import { fonts, troveRawColors } from "../tokens";

/**
 * React Navigation theme in Trove tokens, following the light/dark mode. Native stack headers
 * take their bar style (`dark`), title (`text`), tint (`primary`) and background (`card`) from it,
 * and their props reject dynamic colors, so these are the raw tokens for the current mode.
 */
export function useNavigationTheme(): Theme {
  const mode = useColorMode();
  const raw = troveRawColors[mode];
  return {
    dark: mode === "dark",
    colors: {
      primary: raw.textPrimary,
      background: raw.bgCanvas,
      card: raw.bgCanvas,
      text: raw.textPrimary,
      border: raw.borderSubtle,
      notification: raw.negativeText,
    },
    fonts: {
      regular: { fontFamily: fonts.regular, fontWeight: "400" },
      medium: { fontFamily: fonts.semibold, fontWeight: "600" },
      bold: { fontFamily: fonts.bold, fontWeight: "700" },
      heavy: { fontFamily: fonts.extrabold, fontWeight: "800" },
    },
  };
}
