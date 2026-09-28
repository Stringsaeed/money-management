import { StyleSheet, Text as NativeText, TextInput, View, type TextInputProps } from "react-native";

import { colors, radii, shadows, spacing, typography } from "@/ui/design-tokens";

interface InlineFieldProps {
  readonly emoji: string;
  readonly accessibilityLabel: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoCapitalize?: TextInputProps["autoCapitalize"];
  readonly maxLength?: number;
  readonly testID?: string;
}

/** Single-line card field that sits above an editor's pad (transaction note, account name). */
export function InlineField({
  emoji,
  accessibilityLabel,
  placeholder,
  value,
  onChange,
  autoCapitalize = "sentences",
  maxLength,
  testID,
}: InlineFieldProps) {
  return (
    <View style={styles.row}>
      <NativeText style={styles.emoji}>{emoji}</NativeText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="done"
        style={styles.input}
        submitBehavior="blurAndSubmit"
        testID={testID}
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
