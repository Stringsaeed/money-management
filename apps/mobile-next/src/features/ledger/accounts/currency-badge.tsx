import { StyleSheet, View } from "react-native";

import { CurrencyGlyph } from "@/ui/currency-glyph";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { currencyGlyph, currencySymbol } from "@/utils/money";

interface CurrencyBadgeProps {
  readonly code: string;
}

/** Round symbol badge for a currency row: an SVG glyph (SAR, AED) or its text symbol. */
export function CurrencyBadge({ code }: CurrencyBadgeProps) {
  const glyph = currencyGlyph(code);
  const symbol = currencySymbol(code);

  return (
    <View style={styles.badge}>
      {glyph ? (
        <CurrencyGlyph active name={glyph} size={18} />
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.symbol, symbol.length > 2 && styles.symbolLong]}
        >
          {symbol}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.full,
    height: spacing[10],
    justifyContent: "center",
    paddingHorizontal: spacing[1],
    width: spacing[10],
  },
  symbol: {
    color: colors.ink,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.textLg,
  },
  symbolLong: { fontSize: typography.textXs },
});
