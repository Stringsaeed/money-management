import { useImperativeHandle, useRef, type Ref } from "react";
import {
  Pressable,
  StyleSheet,
  Text as NativeText,
  View,
  type BlurEvent,
  type FocusEvent,
  type TextInput,
} from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";
import { PlanAmountField } from "./plan-amount-field";

export interface PlanAmountRowProps {
  /** Envelope emoji. */
  emoji: string;
  name: string;
  /** Mono hint under the name, e.g. "Last month · 1,540" or "15,000 by 1 Dec · 2 paydays". */
  hint?: string;
  /** Plain decimal string in major units, e.g. "1600". Empty shows a 0 placeholder. */
  value: string;
  /** Receives the sanitized value: digits and at most the currency's decimals. */
  onChangeText: (value: string) => void;
  /** ISO 4217 code: decimals allowed, and the spoken label. */
  currency: string;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: BlurEvent) => void;
  /** iOS done bar above the decimal pad (on by default); false hides it. */
  keyboardAccessory?: boolean;
  /** Previous / next arrows on the done bar, e.g. to walk a list of rows. */
  onPreviousField?: () => void;
  onNextField?: () => void;
  /** The amount TextInput, e.g. to focus the next row. */
  ref?: Ref<TextInput | null>;
  /** Defaults to "{name} amount, {currency}". */
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Plan-amounts row: emoji, envelope name with a mono hint, and a 112pt amount pill. Tapping
 * anywhere on the row focuses the amount.
 */
export function PlanAmountRow({
  emoji,
  name,
  hint,
  value,
  onChangeText,
  currency,
  onFocus,
  onBlur,
  keyboardAccessory,
  onPreviousField,
  onNextField,
  ref,
  accessibilityLabel,
  testID,
}: PlanAmountRowProps) {
  const input = useRef<TextInput | null>(null);
  useImperativeHandle<TextInput | null, TextInput | null>(ref, () => input.current);

  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.row}>
      <NativeText
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.emoji}
      >
        {emoji}
      </NativeText>
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
          {name}
        </Text>
        {hint ? (
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={styles.hint}
          >
            {hint}
          </NativeText>
        ) : null}
      </View>
      <PlanAmountField
        accessibilityHint={hint}
        accessibilityLabel={accessibilityLabel ?? `${name} amount, ${currency}`}
        currency={currency}
        inputRef={input}
        keyboardAccessory={keyboardAccessory}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onNextField={onNextField}
        onPreviousField={onPreviousField}
        testID={testID}
        value={value}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
  },
  emoji: { fontSize: 18, lineHeight: 24 },
  texts: { flex: 1, minWidth: 0 },
  hint: {
    color: colors.text.tertiary,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 15,
  },
});
