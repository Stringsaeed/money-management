import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";

import {
  amountAccessibilityLabel,
  colors,
  currencyFractionDigits,
  CurrencySign,
  decimalSeparator,
  fonts,
  localeGroupSeparator,
} from "@/ui/trove";

import { quickAddAmountLayout } from "./quick-add-amount-layout";

interface QuickAddAmountProps {
  /** The keypad's plain entry: "", "323", "323.5". */
  readonly value: string;
  readonly amountMinor: number;
  readonly currency: string;
  /** Tapping the figure brings the keypad back while a detail editor is open. */
  readonly onPress?: () => void;
}

const DEVICE_DECIMAL = decimalSeparator();
const DEVICE_GROUP = localeGroupSeparator();
/** Board: the currency glyph is 34pt tall beside 56pt digits. */
const GLYPH_RATIO = 34 / 56;
const CARET_RATIO = 44 / 56;

/**
 * The Quick add figure: lime (ink on paper) glyph, big Plex Mono whole part, half-size cents with
 * the untyped ones faded, and a caret. Trove `EntryAmount` sets the cents at full size with no caret.
 */
export function QuickAddAmount({ value, amountMinor, currency, onPress }: QuickAddAmountProps) {
  const layout = quickAddAmountLayout(value, {
    fractionDigits: currencyFractionDigits(currency),
    decimalSeparator: DEVICE_DECIMAL,
    groupSeparator: DEVICE_GROUP,
  });
  const { size } = layout;
  const centsSize = { fontSize: size / 2, lineHeight: size / 2 + 4 };
  return (
    <Pressable
      accessibilityLabel={`Amount: ${amountAccessibilityLabel(amountMinor, currency)}`}
      accessibilityRole="text"
      disabled={!onPress}
      onPress={onPress}
      style={styles.row}
    >
      <CurrencySign code={currency} size={Math.round(size * GLYPH_RATIO)} tone="accent" />
      <NativeText
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          styles.whole,
          { fontSize: size, lineHeight: size + 4 },
          layout.empty ? styles.faded : null,
        ]}
      >
        {layout.whole}
      </NativeText>
      {layout.typedCents || layout.ghostCents ? (
        <NativeText allowFontScaling={false} numberOfLines={1} style={[styles.cents, centsSize]}>
          {layout.empty ? null : layout.typedCents}
          <NativeText style={styles.faded}>
            {layout.empty ? layout.typedCents + layout.ghostCents : layout.ghostCents}
          </NativeText>
        </NativeText>
      ) : null}
      <View style={[styles.caret, { height: Math.round(size * CARET_RATIO) }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  whole: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    letterSpacing: -3,
  },
  cents: { color: colors.text.primary, fontFamily: fonts.mono },
  faded: { color: colors.text.faded },
  caret: { alignSelf: "center", backgroundColor: colors.accent.fill, width: 3 },
});
