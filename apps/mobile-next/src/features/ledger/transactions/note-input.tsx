import { StyleSheet, Text as NativeText, TextInput, View } from "react-native";

import { colors, radii, shadows, spacing, typography } from "@/ui/design-tokens";

interface NoteInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function NoteInput({ value, onChange }: NoteInputProps) {
  return (
    <View style={styles.row}>
      <NativeText style={styles.emoji}>📝</NativeText>
      <TextInput
        accessibilityLabel="Note"
        autoCapitalize="sentences"
        onChangeText={onChange}
        placeholder="Add a note…"
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="done"
        style={styles.input}
        submitBehavior="blurAndSubmit"
        testID="transaction-note-field"
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.kumoLine,
    borderCurve: "continuous",
    borderRadius: radii["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: shadows.sm,
    flexDirection: "row",
    gap: spacing[2],
    marginHorizontal: spacing[5],
    minHeight: spacing[11],
    paddingHorizontal: spacing[3.5],
  },
  emoji: { fontSize: typography.textSm },
  input: {
    color: colors.foreground,
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    minHeight: spacing[10],
    paddingVertical: 0,
  },
});
