import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, type, type TypeVariant } from "../tokens";
import {
  amountAccessibilityLabel,
  amountParts,
  type AmountParts,
  type SignDisplay,
} from "./amount-parts";
import { CurrencySign } from "./currency-sign";

export type AmountSize = "hero" | "lg" | "md" | "sm";
export type AmountTone = "auto" | "primary" | "secondary" | "onPaper" | "positive" | "negative";
type ResolvedTone = Exclude<AmountTone, "auto">;

export interface AmountProps {
  /** Integer minor units (cents, fils); JPY has none. */
  minor: number;
  currency: string;
  size?: AmountSize;
  /** `always` prints `+` on money in; spending always keeps its minus. */
  signDisplay?: SignDisplay;
  /**
   * `auto`: money in shown with `+` is positive.text; everything else text.primary.
   * Spending stays in text.primary — red is only for overspend.
   */
  tone?: AmountTone;
  /** Receipt style: ISO code in caps before the number, e.g. `AED 64.20`. */
  isoCode?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANT = {
  hero: "amountHero",
  lg: "amountLg",
  md: "amountMd",
  sm: "amountSm",
} as const satisfies Record<AmountSize, TypeVariant>;

const resolveTone = (tone: AmountTone, parts: AmountParts): ResolvedTone => {
  if (tone !== "auto") return tone;
  return parts.sign === "+" ? "positive" : "primary";
};

/** Every amount is set in Plex Mono: sign, then currency, then digits. */
export function Amount({
  minor,
  currency,
  size = "md",
  signDisplay = "auto",
  tone = "auto",
  isoCode = false,
  style,
}: AmountProps) {
  const parts = amountParts(minor, currency, signDisplay);
  const resolved = resolveTone(tone, parts);
  const plus = parts.sign === "+" ? "plus " : "";

  return (
    <View
      accessibilityLabel={`${plus}${amountAccessibilityLabel(minor, currency)}`}
      accessibilityRole="text"
      accessible
      style={[styles.row, style]}
    >
      {isoCode ? (
        <ReceiptAmount currency={currency} parts={parts} tone={resolved} />
      ) : (
        <SymbolAmount currency={currency} parts={parts} size={size} tone={resolved} />
      )}
    </View>
  );
}

interface PartsProps {
  currency: string;
  parts: AmountParts;
  tone: ResolvedTone;
}

/** Printed-slip form: `−AED 64.20`, all in the receipt face. */
function ReceiptAmount({ currency, parts, tone }: PartsProps) {
  return (
    <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={tone} variant="receipt">
      {`${parts.sign}${currency} ${parts.whole}${parts.fraction}`}
    </Text>
  );
}

/**
 * Symbol form: `−Đ64.20`. In the hero size the currency sign takes accent.fill (lime on
 * dark, ink on paper) and the cents step down to half size in text.secondary.
 */
function SymbolAmount({ currency, parts, size, tone }: PartsProps & { size: AmountSize }) {
  const variant = VARIANT[size];
  const hero = size === "hero";
  return (
    <>
      {parts.sign ? (
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={tone} variant={variant}>
          {parts.sign}
        </Text>
      ) : null}
      <CurrencySign
        code={currency}
        tone={hero && tone === "primary" ? "accent" : tone}
        variant={variant}
      />
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={tone} variant={variant}>
        {parts.whole}
      </Text>
      {parts.fraction ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={hero ? styles.heroFraction : null}
          tone={hero ? "secondary" : tone}
          variant={variant}
        >
          {parts.fraction}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  heroFraction: {
    fontSize: type.amountHero.fontSize / 2,
    letterSpacing: 0,
    lineHeight: 28,
  },
});
