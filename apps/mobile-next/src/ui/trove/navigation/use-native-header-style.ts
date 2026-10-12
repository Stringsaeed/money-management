import { useColorMode } from "../category/use-color-mode";
import { fonts, troveRawColors } from "../tokens";

/**
 * Colors and fonts for a native stack header. Native header props reject dynamic colors, so
 * this reads the raw token for the current mode.
 */
export function useNativeHeaderStyle() {
  const raw = troveRawColors[useColorMode()];
  return {
    headerTintColor: raw.textPrimary,
    headerStyle: { backgroundColor: raw.bgCanvas },
    headerTitleStyle: { fontFamily: fonts.extrabold, color: raw.textPrimary },
    headerLargeTitleStyle: { fontFamily: fonts.extrabold, color: raw.textPrimary },
  } as const;
}
