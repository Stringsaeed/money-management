import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BACKGROUND_COLORS, PILL_PADDING, SCROLL_FADE_OVERSCAN, TAB_HEIGHT } from "./constants";

/** Converts a `#rrggbb` hex string to an `rgba()` value with the given alpha. */
function withAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * A bottom-anchored vertical gradient that fades the page background into the
 * area behind the glass tab bar, hinting that content scrolls beneath it.
 */
export function ScrollFade() {
  const insets = useSafeAreaInsets();
  const background = BACKGROUND_COLORS[useColorScheme() === "dark" ? "dark" : "light"];

  const pillHeight = TAB_HEIGHT + PILL_PADDING * 2;
  const height = insets.bottom + pillHeight + SCROLL_FADE_OVERSCAN;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[withAlpha(background, 0), background]}
      style={[styles.fade, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
