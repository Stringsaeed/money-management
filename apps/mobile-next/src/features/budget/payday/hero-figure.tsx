import type { ReactNode } from "react";
import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, CurrencySign, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

interface HeroFigureProps {
  readonly currency: string;
  /** Grouped whole units, e.g. "17,000". */
  readonly whole: string;
  /** Faded decimals after it, e.g. ".00"; omit to print whole units only. */
  readonly fraction?: string;
  /** Height of the currency glyph: 30 on Got paid, 28 on Leftovers. */
  readonly glyphSize: 28 | 30;
  /** Nothing entered yet: the figure prints faded too. */
  readonly empty?: boolean;
  /** Pushed to the row's end on the same baseline, e.g. Got paid's "Edit". */
  readonly trailing?: ReactNode;
}

/**
 * The payday hero figure: accent currency glyph, Plex Mono 500 48/52 whole units, faded decimals.
 * The figure is hidden from screen readers; the caller names the amount.
 */
export function HeroFigure({
  currency,
  whole,
  fraction,
  glyphSize,
  empty = false,
  trailing,
}: HeroFigureProps) {
  return (
    <View style={styles.row}>
      <CurrencySign code={currency} size={glyphSize} tone="accent" variant="amountHero" />
      <NativeText
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.whole, empty ? styles.faded : null]}
      >
        {whole}
      </NativeText>
      {fraction ? (
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.fraction}
        >
          {fraction}
        </NativeText>
      ) : null}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  trailing: { marginLeft: "auto" },
  whole: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 48,
    letterSpacing: -2,
    lineHeight: 52,
  },
  // The board's decimals are their own item in the row: Plex Mono 400 24, 8pt after the whole.
  fraction: { color: colors.text.faded, fontFamily: fonts.mono, fontSize: 24, lineHeight: 30 },
  faded: { color: colors.text.faded },
});
