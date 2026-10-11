import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { currencyFractionDigits, decimalSeparator } from "../amount/amount-parts";
import { Text } from "../text";
import { colors, space } from "../tokens";
import { EntryDigit } from "./entry-digit";
import { EntryGlyph } from "./entry-glyph";
import {
  entryAccessibilityLabel,
  entryLayout,
  localeGroupSeparator,
  type EntrySize,
} from "./entry-amount-utils";
import { entryTextStyle } from "./entry-text-style";

export interface EntryAmountProps {
  /** Plain decimal entry the keypad produces: "", "64", "64.", "64.2". */
  value: string;
  currency: string;
  /** Owed or expense: a leading minus. */
  negative?: boolean;
}

const DEVICE_DECIMAL = decimalSeparator();
const DEVICE_GROUP = localeGroupSeparator();

/**
 * The amount being typed, in hero Plex Mono: unfilled cents faded, each new digit fading from faded to
 * primary over 120 ms, steps 60 to 44 to 34 as the number grows, one line, a leading minus for money
 * owed, and the currency glyph tinted entry.glyph.
 */
export function EntryAmount({ value, currency, negative = false }: EntryAmountProps) {
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);

  const layout = entryLayout(value, {
    fractionDigits: currencyFractionDigits(currency),
    decimalSeparator: DEVICE_DECIMAL,
    groupSeparator: DEVICE_GROUP,
  });
  const { size, empty } = layout;

  return (
    <View
      accessibilityLabel={entryAccessibilityLabel(value, currency, negative)}
      accessibilityRole="text"
      accessible
      style={styles.row}
    >
      {/* No minus on an empty entry: "−0.00" means nothing yet. */}
      {negative && !empty ? <Minus size={size} /> : null}
      <View style={[styles.glyph, { paddingBottom: Math.round(size * 0.12) }]}>
        <EntryGlyph currency={currency} faded={empty} size={size} />
      </View>
      <View style={styles.digits}>
        {layout.chars.map((entry) => (
          <EntryDigit
            char={entry.char}
            empty={empty}
            fadeIn={settled && entry.kind === "digit"}
            key={entry.key}
            kind={entry.kind}
            size={size}
          />
        ))}
      </View>
    </View>
  );
}

function Minus({ size }: { size: EntrySize }) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      maxFontSizeMultiplier={1}
      style={[entryTextStyle(size), { color: colors.text.secondary }]}
      variant="amountHero"
    >
      −
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-end",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: space[1] + 2,
  },
  glyph: { justifyContent: "flex-end" },
  digits: { alignItems: "flex-end", flexDirection: "row", flexWrap: "nowrap" },
});
