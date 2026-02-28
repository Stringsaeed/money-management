import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { centsToDecimalString, decimalStringToCents } from "@/utils/currency";

interface AmountInputProps {
  valueCents: number;
  onChangeCents: (cents: number) => void;
  currency?: string;
  style?: object;
}

/**
 * A currency-aware numeric input.
 * Displays formatted value; stores and returns integer cents.
 */
export function AmountInput({
  valueCents,
  onChangeCents,
  currency = "USD",
  style,
}: AmountInputProps) {
  const [raw, setRaw] = useState(valueCents > 0 ? centsToDecimalString(valueCents) : "");
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    // Allow only digits and a single decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    setRaw(normalized);
    onChangeCents(decimalStringToCents(normalized));
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={style}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 16, color: "#6B7280", fontWeight: "600" }}>{currency}</Text>
        <TextInput
          ref={inputRef}
          value={raw}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={{ flex: 1, fontSize: 22, fontWeight: "600" }}
          returnKeyType="done"
        />
      </View>
    </Pressable>
  );
}
