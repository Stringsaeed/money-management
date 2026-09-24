import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, typography } from "@/ui/design-tokens";
import {
  amountDisplayParts,
  amountFontSize,
  amountSymbol,
  amountSymbolLength,
} from "./amount-entry";
import { AmountGlyph } from "./amount-glyph";
import { AmountSymbol } from "./amount-symbol";

interface AmountDisplayProps {
  readonly amount: string;
  /** Null until an account is picked; the amount then renders without a symbol. */
  readonly currency: string | null;
  readonly fractionDigits: number;
}

export function AmountDisplay({ amount, currency, fractionDigits }: AmountDisplayProps) {
  const parts = amountDisplayParts(amount, fractionDigits);
  const empty = amount === "";
  const symbol = amountSymbol(currency);
  const fraction = `${parts.typedFraction}${parts.pendingFraction}`;
  const fontSize = amountFontSize(
    amountSymbolLength(symbol) +
      parts.whole.length +
      (fractionDigits > 0 ? fraction.length + 1 : 0),
  );
  // Dynamic size from the entered value; the symbol and fraction stay at ~56% of the digits.
  const sizes = { line: { fontSize }, minor: { fontSize: Math.round(fontSize * 0.56) } };

  return (
    <View
      accessibilityLabel={`Amount ${parts.whole}${parts.hasDecimal ? `.${parts.typedFraction}` : ""}${currency ? ` ${currency}` : ""}`}
      accessibilityRole="text"
      style={styles.container}
      testID="transaction-amount"
    >
      <AmountGlyph active={!empty} fontSize={fontSize} symbol={symbol} />
      <NativeText numberOfLines={1} style={[styles.line, sizes.line]}>
        <AmountSymbol active={!empty} fontSize={sizes.minor.fontSize} symbol={symbol} />
        <NativeText style={[styles.whole, empty && styles.placeholder]}>{parts.whole}</NativeText>
        {fractionDigits > 0 ? (
          <NativeText style={sizes.minor}>
            <NativeText style={!parts.hasDecimal && styles.placeholder}>.</NativeText>
            <NativeText>{parts.typedFraction}</NativeText>
            <NativeText style={styles.placeholder}>{parts.pendingFraction}</NativeText>
          </NativeText>
        ) : null}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "center",
  },
  line: {
    flexShrink: 1,
    color: colors.ink,
    fontFamily: typography.fontHeadingBold,
    fontVariant: ["tabular-nums"],
    letterSpacing: typography.trackingTight,
    textAlign: "center",
  },
  whole: { color: colors.ink },
  placeholder: { color: colors.mutedForeground, opacity: 0.6 },
});
