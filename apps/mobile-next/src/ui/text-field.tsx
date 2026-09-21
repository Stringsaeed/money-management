import { useId, useState } from "react";
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { colors, radii, spacing, typography } from "./design-tokens";
import { Text } from "./text";
import { KeyboardAccessory } from "./keyboard-accessory";

export interface TextFieldProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const accessoryId = useId();

  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      <TextInput
        {...props}
        inputAccessoryViewID={
          Platform.OS === "ios" ? (props.inputAccessoryViewID ?? accessoryId) : undefined
        }
        accessibilityLabel={label}
        aria-invalid={Boolean(error)}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onChangeText={onChangeText}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError]}
        value={value}
      />
      <KeyboardAccessory nativeID={accessoryId} />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.input,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    minHeight: spacing[12],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  inputFocused: {
    borderColor: colors.sage,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  error: {
    color: colors.destructive,
  },
});
