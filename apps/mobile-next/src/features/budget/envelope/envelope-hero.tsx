import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, CurrencySign, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

import type { EnvelopeHeroModel } from "./envelope-display";
import { EnvelopeHeroBar } from "./envelope-hero-bar";
import { HeroChip } from "./hero-chip";

interface EnvelopeHeroProps {
  readonly hero: EnvelopeHeroModel;
  readonly currency: string;
  /** Share of the pay period gone, 0…1. */
  readonly pace: number;
}

/** Glyph height beside the 48pt figure (33×28 for the dirham). */
const GLYPH_SIZE = 28;

/** M4 hero: LEFT · AED, the figure, what it is out of, the bar with its pace tick, and the chip. */
export function EnvelopeHero({ hero, currency, pace }: EnvelopeHeroProps) {
  return (
    <View style={styles.column}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        tone="tertiary"
        variant="stamp"
      >
        {`LEFT · ${currency}`}
      </Text>
      <View
        accessibilityLabel={hero.accessibilityLabel}
        accessibilityRole="text"
        accessible
        style={styles.figureRow}
      >
        <CurrencySign
          code={currency}
          size={GLYPH_SIZE}
          tone={hero.negative ? "negative" : "primary"}
          variant="amountHero"
        />
        <NativeText
          adjustsFontSizeToFit
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          minimumFontScale={0.5}
          numberOfLines={1}
          style={[styles.figure, hero.negative ? styles.figureNegative : null]}
        >
          {hero.figure}
        </NativeText>
      </View>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.ofLine}>
        {hero.ofLine}
      </NativeText>
      <EnvelopeHeroBar over={hero.over} pace={pace} progress={hero.progress} />
      <HeroChip text={hero.chip.text} tone={hero.chip.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  figureRow: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  // Board: Plex Mono 500 48/52, -2 tracking; no amount variant is that size.
  figure: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 48,
    letterSpacing: -2,
    lineHeight: 52,
  },
  figureNegative: { color: colors.negative.text },
  ofLine: { color: colors.text.secondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
});
