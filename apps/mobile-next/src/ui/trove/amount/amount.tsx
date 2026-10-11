import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, type, type TypeVariant } from "../tokens";
import { DEFAULT_SIGNIFICANT } from "./decimal-format";
import {
  amountAccessibilityLabel,
  amountParts,
  decimalAmountAccessibilityLabel,
  decimalAmountParts,
  type AmountParts,
  type DecimalAmountParts,
  type SignDisplay,
} from "./amount-parts";
import { CurrencySign } from "./currency-sign";

export type AmountSize = "hero" | "lg" | "md" | "sm";
export type AmountTone = "auto" | "primary" | "secondary" | "onPaper" | "positive" | "negative";
type ResolvedTone = Exclude<AmountTone, "auto">;

interface AmountBaseProps {
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

interface MinorAmountProps extends AmountBaseProps {
  /** Integer minor units (cents, fils); JPY has none. */
  minor: number;
  value?: never;
  significant?: never;
}

interface DecimalAmountProps extends AmountBaseProps {
  /**
   * Decimal string for prices, e.g. `"61240.18"` or `"0.00001842"`. Parsed digit by digit,
   * never as a float. >= 1 keeps the currency's decimals; below 1, `significant` digits.
   */
  value: string;
  /** Significant digits kept below 1 (default 4). Digits past the cents step down and fade. */
  significant?: number;
  minor?: never;
}

/** Either whole minor units (`minor`) or a decimal string (`value`) — never both. */
export type AmountProps = MinorAmountProps | DecimalAmountProps;

const VARIANT = {
  hero: "amountHero",
  lg: "amountLg",
  md: "amountMd",
  sm: "amountSm",
} as const satisfies Record<AmountSize, TypeVariant>;

const resolveTone = (tone: AmountTone, parts: Pick<AmountParts, "sign">): ResolvedTone => {
  if (tone !== "auto") return tone;
  return parts.sign === "+" ? "positive" : "primary";
};

const TAIL_VARIANT = {
  hero: "amountLg",
  lg: "amountMd",
  md: "amountSm",
  sm: "amountSm",
} as const satisfies Record<AmountSize, TypeVariant>;

interface ResolvedAmount {
  parts: DecimalAmountParts;
  spoken: string;
}

const resolveAmount = (props: AmountProps, signDisplay: SignDisplay): ResolvedAmount => {
  if (props.value !== undefined) {
    const significant = props.significant ?? DEFAULT_SIGNIFICANT;
    return {
      parts: decimalAmountParts(props.value, props.currency, signDisplay, significant),
      spoken: decimalAmountAccessibilityLabel(props.value, props.currency, significant),
    };
  }
  return {
    parts: { ...amountParts(props.minor, props.currency, signDisplay), tail: "" },
    spoken: amountAccessibilityLabel(props.minor, props.currency),
  };
};

/**
 * Every amount is set in Plex Mono: sign, then currency, then digits. Pass `minor` for ledger
 * money or `value` (a decimal string) for prices that can run below a cent.
 */
export function Amount(props: AmountProps) {
  const { currency, size = "md", signDisplay = "auto", tone = "auto", isoCode = false } = props;
  const { parts, spoken } = resolveAmount(props, signDisplay);
  const resolved = resolveTone(tone, parts);
  const plus = parts.sign === "+" ? "plus " : "";

  return (
    <View
      accessibilityLabel={`${plus}${spoken}`}
      accessibilityRole="text"
      accessible
      style={[styles.row, props.style]}
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
  parts: DecimalAmountParts;
  tone: ResolvedTone;
}

/** Printed-slip form: `−AED 64.20`, all in the receipt face. */
function ReceiptAmount({ currency, parts, tone }: PartsProps) {
  return (
    <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={tone} variant="receipt">
      {`${parts.sign}${currency} ${parts.whole}${parts.fraction}`}
      {parts.tail ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.receiptTail}
          tone="tertiary"
          variant="receipt"
        >
          {parts.tail}
        </Text>
      ) : null}
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
      {parts.tail ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={size === "sm" ? styles.tailSm : null}
          tone="tertiary"
          variant={TAIL_VARIANT[size]}
        >
          {parts.tail}
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
  receiptTail: { fontSize: type.receipt.fontSize - 2 },
  tailSm: { fontSize: type.amountSm.fontSize - 2 },
  heroFraction: {
    fontSize: type.amountHero.fontSize / 2,
    letterSpacing: 0,
    lineHeight: 28,
  },
});
