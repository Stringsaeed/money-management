import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, compactAmount, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

import { HeroFigure } from "./hero-figure";

interface LeftoversHeroProps {
  readonly currency: string;
  readonly totalMinor: number;
  /** Each envelope's part, e.g. "🛒 64 · ⛽ 40 · Fun 56". */
  readonly shares: string;
}

/** What Everyday left over, as a hero figure, then the question and each envelope's part. */
export function LeftoversHero({ currency, totalMinor, shares }: LeftoversHeroProps) {
  const total = compactAmount(totalMinor, currency);
  return (
    <View style={styles.block}>
      <View accessibilityLabel={`Everyday left over, ${currency} ${total}`} accessible>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
          {`Everyday left over · ${currency}`}
        </Text>
        <View style={styles.figure}>
          <HeroFigure currency={currency} glyphSize={28} whole={total} />
        </View>
      </View>
      <NativeText accessibilityRole="header" style={styles.title}>
        Nice. Where should it go?
      </NativeText>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.shares}>
        {shares}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 6 },
  figure: { marginTop: 6 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
    marginTop: 4,
  },
  shares: { color: colors.text.secondary, fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
});
