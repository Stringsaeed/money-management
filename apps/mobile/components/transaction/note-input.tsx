import { View } from "react-native";

import { Text } from "@/components/ui/text";

import { TransactionTextField } from "./ui/transaction-text-field";

interface NoteInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function NoteInput({ value, onChange }: NoteInputProps) {
  return (
    <View className="px-5 py-2 flex-row items-center gap-2">
      <Text className="text-base">📝</Text>
      <TransactionTextField
        value={value}
        onChangeText={onChange}
        placeholder="Add a note..."
        accessibilityLabel="Transaction note"
        autoCapitalize="sentences"
        returnKeyType="done"
        testID="transaction-note-field"
      />
    </View>
  );
}
