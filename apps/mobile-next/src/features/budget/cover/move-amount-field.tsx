import { useState } from "react";
import { StyleSheet, Text as NativeText, TextInput, View } from "react-native";
import {
  colors,
  currencyFractionDigits,
  CurrencySign,
  DENSE_MAX_FONT_SCALE,
  fonts,
  formatAmountDisplay,
  sanitizeAmountInput,
  Text,
  useKeyboardAccessory,
} from "@/ui/trove";

import { MoveCaret } from "./move-caret";

interface MoveAmountFieldProps {
  /** Plain decimal string in major units, e.g. `175` or `64.2`. */
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly currency: string;
  /** Mono caps caption, e.g. "AMOUNT · UP TO 282". */
  readonly label: string;
}

/** Glyph height beside the 52pt figure (35×30 for the dirham). */
const GLYPH_SIZE = 30;

/**
 * Move money's amount: a centred 52pt Plex Mono figure with the currency glyph and a caret. A
 * transparent decimal TextInput sits over it, so the keyboard, paste and screen readers work.
 */
export function MoveAmountField({ value, onChangeText, currency, label }: MoveAmountFieldProps) {
  const [focused, setFocused] = useState(false);
  const accessory = useKeyboardAccessory({ keyboardType: "decimal-pad" });
  const empty = value === "";
  return (
    <View style={styles.column}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        tone="tertiary"
        variant="stamp"
      >
        {label}
      </Text>
      <View style={styles.entry}>
        <View
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.display}
        >
          <CurrencySign code={currency} size={GLYPH_SIZE} tone="accent" variant="amountHero" />
          <NativeText
            adjustsFontSizeToFit
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            minimumFontScale={0.5}
            numberOfLines={1}
            style={[styles.figure, empty ? styles.placeholder : null]}
          >
            {empty ? "0" : formatAmountDisplay(value)}
          </NativeText>
          {focused ? <MoveCaret /> : null}
        </View>
        <TextInput
          accessibilityLabel={label}
          caretHidden
          inputAccessoryViewID={accessory.inputAccessoryViewID}
          keyboardType="decimal-pad"
          onBlur={() => setFocused(false)}
          onChangeText={(text) =>
            onChangeText(sanitizeAmountInput(text, currencyFractionDigits(currency)))
          }
          onFocus={() => setFocused(true)}
          style={styles.input}
          value={value}
        />
        {accessory.bar}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: "center", gap: 4, paddingVertical: 8 },
  entry: { alignItems: "center", alignSelf: "stretch", justifyContent: "center", minHeight: 56 },
  display: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  // Board: Plex Mono 500 52/56, -2.5 tracking.
  figure: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 52,
    letterSpacing: -2.5,
    lineHeight: 56,
  },
  placeholder: { color: colors.text.tertiary },
  // Invisible but focusable: the native input owns typing, paste and accessibility.
  input: { bottom: 0, color: "transparent", left: 0, position: "absolute", right: 0, top: 0 },
});
