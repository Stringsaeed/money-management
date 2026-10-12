import type { Ref } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  type BlurEvent,
  type FocusEvent,
} from "react-native";

import { currencyFractionDigits } from "../amount";
import { AmountCaret } from "../controls/amount-caret";
import { formatAmountDisplay, sanitizeAmountInput } from "../controls/amount-input-utils";
import { useFocusState } from "../controls/use-focus-state";
import { useKeyboardAccessory } from "../pickers/use-keyboard-accessory";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "../tokens";

export interface PlanAmountFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  currency: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: BlurEvent) => void;
  keyboardAccessory?: boolean;
  onPreviousField?: () => void;
  onNextField?: () => void;
  inputRef: Ref<TextInput>;
  testID?: string;
}

const PADDING = 14;

/**
 * 112×38 amount pill. Like `AmountInput`, the figure is drawn in Plex Mono and a transparent
 * decimal-pad TextInput sits over it, so grouping ("1,600") and the accent caret match the board
 * while typing, paste and screen readers stay native.
 */
export function PlanAmountField({
  value,
  onChangeText,
  currency,
  accessibilityLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  keyboardAccessory,
  onPreviousField,
  onNextField,
  inputRef,
  testID,
}: PlanAmountFieldProps) {
  const focus = useFocusState(onFocus, onBlur);
  const accessory = useKeyboardAccessory({
    keyboardType: "decimal-pad",
    enabled: keyboardAccessory,
    onPrevious: onPreviousField,
    onNext: onNextField,
  });
  const fractionDigits = currencyFractionDigits(currency);
  const empty = value === "";

  return (
    <View style={[styles.field, focus.focused ? styles.focused : styles.idle]}>
      <View
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.display}
      >
        <NativeText
          adjustsFontSizeToFit
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          minimumFontScale={0.7}
          numberOfLines={1}
          style={[styles.figure, empty ? styles.placeholder : null]}
        >
          {empty ? "0" : formatAmountDisplay(value)}
        </NativeText>
        {focus.focused ? <AmountCaret size="field" /> : null}
      </View>
      <TextInput
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        caretHidden
        inputAccessoryViewID={accessory.inputAccessoryViewID}
        keyboardType="decimal-pad"
        onBlur={focus.onBlur}
        onChangeText={(text) => onChangeText(sanitizeAmountInput(text, fractionDigits))}
        onFocus={focus.onFocus}
        ref={inputRef}
        style={styles.input}
        testID={testID}
        value={value}
      />
      {accessory.bar}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.fill.neutral,
    borderCurve: "continuous",
    borderRadius: radius.full,
    height: 38,
    justifyContent: "center",
    width: 112,
  },
  // The ring grows 1pt → 2pt on focus; padding gives the width back so the figure never moves.
  idle: { borderColor: colors.border.default, borderWidth: 1, paddingHorizontal: PADDING - 1 },
  focused: { borderColor: colors.accent.fill, borderWidth: 2, paddingHorizontal: PADDING - 2 },
  display: { alignItems: "center", flexDirection: "row", justifyContent: "flex-end" },
  figure: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    lineHeight: 20,
  },
  placeholder: { color: colors.text.tertiary },
  // Invisible but focusable: the native input owns typing, paste and accessibility.
  input: {
    bottom: 0,
    color: "transparent",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
