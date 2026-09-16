import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { spacing, typography } from "@/lib/design-tokens";

import { TransactionTextField } from "./ui/transaction-text-field";

interface NoteInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function NoteInput({ value, onChange }: NoteInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📝</Text>
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  emoji: {
    fontSize: typography.textBase,
  },
});
