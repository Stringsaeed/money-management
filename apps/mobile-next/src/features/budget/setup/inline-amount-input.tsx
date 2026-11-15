import type { Ref } from "react";
import { StyleSheet, Text as NativeText, TextInput, View } from "react-native";

import {
  colors,
  currencyFractionDigits,
  CurrencySign,
  DENSE_MAX_FONT_SCALE,
  fonts,
  formatAmountDisplay,
  sanitizeAmountInput,
  useKeyboardAccessory,
} from "@/ui/trove";

interface InlineAmountInputProps {
  /** Plain decimal text in major units, e.g. "17000". Empty shows a 0 placeholder. */
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly currency: string;
  readonly accessibilityLabel: string;
  /** salary: 17pt with the currency sign (S2 card) · share: 16pt bare (H2 share tile). */
  readonly size: "salary" | "share";
  readonly inputRef?: Ref<TextInput>;
}

/**
 * A bare mono figure that edits in place. The grouped figure ("17,000") is drawn in Plex Mono
 * and a transparent decimal-pad TextInput sits over it, as Trove's amount fields do, so typing,
 * paste and screen readers stay native.
 */
export function InlineAmountInput({
  value,
  onChangeText,
  currency,
  accessibilityLabel,
  size,
  inputRef,
}: InlineAmountInputProps) {
  const accessory = useKeyboardAccessory({ keyboardType: "decimal-pad" });
  const empty = value === "";
  return (
    <View style={styles.field}>
      <View
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.display}
      >
        {size === "salary" ? <CurrencySign code={currency} size={12} tone="primary" /> : null}
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={[
            size === "salary" ? styles.salary : styles.share,
            empty ? styles.placeholder : null,
          ]}
        >
          {empty ? "0" : formatAmountDisplay(value)}
        </NativeText>
      </View>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        inputAccessoryViewID={accessory.inputAccessoryViewID}
        keyboardType="decimal-pad"
        onChangeText={(text) =>
          onChangeText(sanitizeAmountInput(text, currencyFractionDigits(currency)))
        }
        ref={inputRef}
        selectionColor={colors.accent.fill}
        style={styles.input}
        textAlign="right"
        value={value}
      />
      {accessory.bar}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { justifyContent: "center", minHeight: 24, minWidth: 48 },
  display: { alignItems: "center", flexDirection: "row", gap: 4, justifyContent: "flex-end" },
  salary: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  share: { color: colors.text.primary, fontFamily: fonts.monoMedium, fontSize: 16, lineHeight: 21 },
  placeholder: { color: colors.text.tertiary },
  // Invisible but focusable: the native input owns typing, paste and accessibility.
  input: {
    bottom: 0,
    color: "transparent",
    left: 0,
    padding: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
