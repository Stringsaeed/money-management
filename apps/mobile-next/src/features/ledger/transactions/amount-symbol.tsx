import { StyleSheet, useColorScheme } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- The symbol's color tween matches the currency glyph, which needs Reanimated.
import Animated, { interpolateColor, useAnimatedStyle } from "react-native-reanimated";

import { rawColorValues, typography } from "@/ui/design-tokens";
import { useTintProgress } from "@/ui/use-tint-progress";

import type { AmountSymbol as AmountSymbolModel } from "./amount-entry";

interface AmountSymbolProps {
  readonly symbol: AmountSymbolModel;
  readonly fontSize: number;
  /** Tints from muted to ink once a value is entered. */
  readonly active: boolean;
}

/** Text symbols ("$", "€") render inline so they share the amount's baseline; glyphs use `AmountGlyph`. */
export function AmountSymbol({ symbol, fontSize, active }: AmountSymbolProps) {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? rawColorValues.dark : rawColorValues.light;
  const muted = palette.mutedForeground;
  const ink = palette.ink;
  const progress = useTintProgress(active);
  const tint = useAnimatedStyle(
    () => ({ color: interpolateColor(progress.value, [0, 1], [muted, ink]) }),
    [muted, ink],
  );

  if (symbol.kind !== "text") return null;
  return <Animated.Text style={[styles.symbol, { fontSize }, tint]}>{symbol.label}</Animated.Text>;
}

const styles = StyleSheet.create({
  symbol: { fontFamily: typography.fontHeadingMedium },
});
