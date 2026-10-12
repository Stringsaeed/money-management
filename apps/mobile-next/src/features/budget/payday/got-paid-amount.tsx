import { useRef } from "react";
import { Pressable, StyleSheet, Text as NativeText, TextInput, View } from "react-native";

import {
  colors,
  currencyFractionDigits,
  DENSE_MAX_FONT_SCALE,
  fonts,
  sanitizeAmountInput,
  useKeyboardAccessory,
} from "@/ui/trove";

import { HeroFigure } from "./hero-figure";
import { entryFigure } from "./payday-money";

interface GotPaidAmountProps {
  /** Plain decimal string in major units, e.g. "17000". */
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly currency: string;
}

/**
 * The salary, printed as the hero figure with an Edit link. A transparent decimal-pad input sits
 * over the figure, as in Trove's AmountInput, so typing, paste and screen readers all work.
 */
export function GotPaidAmount({ value, onChangeText, currency }: GotPaidAmountProps) {
  const input = useRef<TextInput>(null);
  const accessory = useKeyboardAccessory({ keyboardType: "decimal-pad" });
  const figure = entryFigure(value, currency);
  const fractionDigits = currencyFractionDigits(currency);

  return (
    <View>
      <HeroFigure
        currency={currency}
        empty={figure.empty}
        fraction={figure.fraction}
        glyphSize={30}
        trailing={
          <Pressable
            accessibilityLabel="Edit salary amount"
            accessibilityRole="button"
            hitSlop={EDIT_HIT_SLOP}
            onPress={() => input.current?.focus()}
          >
            <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.edit}>
              Edit
            </NativeText>
          </Pressable>
        }
        whole={figure.whole}
      />
      <TextInput
        accessibilityLabel={`Salary amount, ${currency}`}
        caretHidden
        inputAccessoryViewID={accessory.inputAccessoryViewID}
        keyboardType="decimal-pad"
        onChangeText={(text) => onChangeText(sanitizeAmountInput(text, fractionDigits))}
        ref={input}
        selectTextOnFocus
        style={styles.input}
        value={value}
      />
      {accessory.bar}
    </View>
  );
}

/** Lifts the 18pt link to the 44pt target. */
const EDIT_HIT_SLOP = { top: 13, bottom: 13, left: 12, right: 12 } as const;

const styles = StyleSheet.create({
  edit: { color: colors.accent.text, fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 18 },
  // Invisible but focusable over the figure (not the Edit link): the native input owns typing.
  input: {
    bottom: 0,
    color: "transparent",
    left: 0,
    position: "absolute",
    right: 64,
    top: 0,
  },
});
