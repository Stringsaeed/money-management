import { createNanoIconSet } from "react-native-nano-icons";
import { StyleSheet, View } from "react-native";

import glyphMap from "../../../../assets/nanoicons/TroveCurrencies.glyphmap.json";
import { amountParts } from "../amount";
import { Text } from "../text";
import { colors, fonts, radius, troveRawColors } from "../tokens";
import { currencyName } from "./currency-name";
import { useColorMode } from "./use-color-mode";

const CurrencyGlyphIcon = createNanoIconSet(glyphMap);

export type CurrencyBadgeSize = 24 | 36 | 48;

export interface CurrencyBadgeProps {
  /** ISO 4217 code. AED and SAR draw SVG glyphs; € £ ¥ $ come from Plex Mono. */
  code: string;
  size?: CurrencyBadgeSize;
  /** Spoken name; defaults to the currency's English name ("Euro"), else the code. */
  accessibilityLabel?: string;
}

const GLYPH_SIZE = { 24: 9, 36: 14, 48: 18 } as const satisfies Record<CurrencyBadgeSize, number>;

/**
 * Round glyph badge marking an account's own currency when it differs from the main one.
 * Ink on a neutral disc in both modes.
 */
export function CurrencyBadge({ code, size = 36, accessibilityLabel }: CurrencyBadgeProps) {
  const mode = useColorMode();
  const { glyph, symbol } = amountParts(0, code);

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? currencyName(code)}
      accessibilityRole="image"
      accessible
      style={[styles.disc, disc[size]]}
    >
      {glyph ? (
        <CurrencyGlyphIcon
          accessibilityElementsHidden
          accessible={false}
          color={troveRawColors[mode].textPrimary}
          importantForAccessibility="no"
          name={glyph}
          size={GLYPH_SIZE[size]}
        />
      ) : (
        <Text
          accessibilityElementsHidden
          allowFontScaling={false}
          importantForAccessibility="no"
          style={symbolType[size]}
        >
          {symbol}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    justifyContent: "center",
  },
});

const disc = StyleSheet.create({
  24: { height: 24, width: 24 },
  36: { height: 36, width: 36 },
  48: { height: 48, width: 48 },
});

const symbolType = StyleSheet.create({
  24: { fontFamily: fonts.monoSemibold, fontSize: 12, lineHeight: 16 },
  36: { fontFamily: fonts.monoMedium, fontSize: 17, lineHeight: 22 },
  48: { fontFamily: fonts.monoMedium, fontSize: 22, lineHeight: 28 },
});
