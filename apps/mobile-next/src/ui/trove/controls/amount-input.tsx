import { StyleSheet, TextInput, View } from "react-native";

import { currencyFractionDigits, CurrencySign } from "../amount";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius, space, type } from "../tokens";
import { AmountCaret } from "./amount-caret";
import {
  formatAmountDisplay,
  isQuickPickSelected,
  quickPickLabel,
  sanitizeAmountInput,
} from "./amount-input-utils";
import { QuickPickChip } from "./quick-pick-chip";
import { useFocusState } from "./use-focus-state";

export interface AmountInputProps {
  /** Plain decimal string in major units, e.g. `250` or `64.2`. Empty shows a 0 placeholder. */
  value: string;
  onChangeText: (value: string) => void;
  /** ISO 4217 code for the sign and for how many decimals are allowed. */
  currency: string;
  /** Caption above the number, e.g. "Move to Emergency fund". */
  label?: string;
  /** Chip amounts in major units, e.g. [50, 100, 250]. Tapping one fills the amount. */
  quickPicks?: readonly number[];
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Big amount entry. The visible number is drawn in Plex Mono at hero size; a transparent
 * numeric TextInput sits over it so the system keyboard, paste and screen readers all work.
 */
export function AmountInput({
  value,
  onChangeText,
  currency,
  label,
  quickPicks = [],
  autoFocus = false,
  testID,
}: AmountInputProps) {
  const focus = useFocusState();
  const fractionDigits = currencyFractionDigits(currency);
  const empty = value === "";

  return (
    <View style={styles.card}>
      {label ? (
        <Text tone="secondary" variant="labelSm">
          {label}
        </Text>
      ) : null}
      <View style={styles.entry}>
        <View
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.display}
        >
          <CurrencySign code={currency} tone="secondary" variant="amountLg" />
          <Text
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            tone={empty ? "tertiary" : "primary"}
            variant="amountHero"
          >
            {empty ? "0" : formatAmountDisplay(value)}
          </Text>
          {focus.focused ? <AmountCaret /> : null}
        </View>
        <TextInput
          accessibilityLabel={label ?? "Amount"}
          autoFocus={autoFocus}
          caretHidden
          keyboardType="decimal-pad"
          onBlur={focus.onBlur}
          onChangeText={(text) => onChangeText(sanitizeAmountInput(text, fractionDigits))}
          onFocus={focus.onFocus}
          style={styles.input}
          testID={testID}
          value={value}
        />
      </View>
      {quickPicks.length > 0 ? (
        <View style={styles.chips}>
          {quickPicks.map((amount) => (
            <QuickPickChip
              key={amount}
              label={quickPickLabel(amount, currency)}
              onPress={() => onChangeText(String(amount))}
              selected={isQuickPickSelected(value, amount)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.lg,
    gap: space[4],
    paddingHorizontal: space[4],
    paddingVertical: space[6],
  },
  entry: { alignItems: "center", justifyContent: "center", minHeight: type.amountHero.lineHeight },
  display: { alignItems: "baseline", flexDirection: "row", gap: space[0.5] },
  // Invisible but focusable: the native input owns typing, paste and accessibility.
  input: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    color: "transparent",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2], justifyContent: "center" },
});
