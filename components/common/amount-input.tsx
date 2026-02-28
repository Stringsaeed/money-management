import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
      <View className="flex-row items-center border border-gray-300 rounded-[10px] px-3.5 py-3 gap-1.5">
        <Text className="text-base text-gray-500 font-semibold">{currency}</Text>
        <TextInput
          ref={inputRef}
          value={raw}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          className="flex-1 text-[22px] font-semibold"
          style={{ fontVariant: ["tabular-nums"] }}
          returnKeyType="done"
        />
      </View>
    </Pressable>
  );
}
