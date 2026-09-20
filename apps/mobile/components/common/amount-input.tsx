import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import { centsToDecimalString, decimalStringToCents } from "@/utils/currency";

interface AmountInputProps {
  valueCents: number;
  onChangeCents: (cents: number) => void;
  currency?: string;
}

/**
 * Currency-aware numeric input — stores and returns integer cents.
 */
export function AmountInput({ valueCents, onChangeCents, currency = "USD" }: AmountInputProps) {
  const [raw, setRaw] = useState(valueCents > 0 ? centsToDecimalString(valueCents) : "");
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    setRaw(normalized);
    onChangeCents(decimalStringToCents(normalized));
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={styles.row}>
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          ref={inputRef}
          value={raw}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={[styles.input, inputTextStyle, { fontVariant: ["tabular-nums"] }]}
          returnKeyType="done"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.DEFAULT,
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[3],
    gap: spacing[1.5],
  },
  currency: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.mutedForeground,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontBodySemibold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.foreground,
  },
});
