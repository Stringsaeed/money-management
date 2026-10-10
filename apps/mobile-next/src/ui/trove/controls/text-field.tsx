import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { Text, type TextTone } from "../text";
import { useKeyboardAccessory } from "../pickers/use-keyboard-accessory";
import { colors, radius, space, type } from "../tokens";
import { FieldError } from "./field-error";
import { useFocusState } from "./use-focus-state";

export interface TextFieldProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "editable"
> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Shown under the field; also switches the field to the negative treatment. */
  error?: string;
  disabled?: boolean;
  /**
   * iOS only. Number pads and email keyboards have no return key, so a done bar is added
   * above them automatically; pass false to opt out, or true to add it to any keyboard.
   */
  keyboardAccessory?: boolean;
  /** Previous / next arrows on the done bar. The arrows show only when one is given. */
  onPreviousField?: () => void;
  onNextField?: () => void;
}

type FieldState = "default" | "focused" | "error" | "disabled";

const LABEL_TONE = {
  default: "secondary",
  focused: "accent",
  error: "negative",
  disabled: "disabled",
} as const satisfies Record<FieldState, TextTone>;

const resolveState = (disabled: boolean, error: boolean, focused: boolean): FieldState => {
  if (disabled) return "disabled";
  if (error) return "error";
  return focused ? "focused" : "default";
};

/**
 * Pill text field, 52pt: label above, ink ring on focus, negative ring and message on error.
 * Number-pad, decimal-pad, phone-pad and email keyboards get a done bar on iOS.
 */
export function TextField({
  label,
  value,
  onChangeText,
  error,
  disabled = false,
  keyboardAccessory,
  onPreviousField,
  onNextField,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...props
}: TextFieldProps) {
  const focus = useFocusState(onFocus, onBlur);
  const state = resolveState(disabled, Boolean(error), focus.focused);
  const accessory = useKeyboardAccessory({
    keyboardType: props.keyboardType,
    inputAccessoryViewID: props.inputAccessoryViewID,
    enabled: keyboardAccessory,
    onPrevious: onPreviousField,
    onNext: onNextField,
  });

  return (
    <View style={styles.field}>
      <Text tone={LABEL_TONE[state]} variant="labelSm">
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.text.tertiary}
        selectionColor={colors.accent.fill}
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        aria-invalid={Boolean(error)}
        editable={!disabled}
        inputAccessoryViewID={accessory.inputAccessoryViewID}
        onBlur={focus.onBlur}
        onChangeText={onChangeText}
        onFocus={focus.onFocus}
        style={[styles.input, stateStyles[state]]}
        value={value}
      />
      {accessory.bar}
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: {
    borderRadius: radius.full,
    fontFamily: type.bodyLg.fontFamily,
    fontSize: type.bodyLg.fontSize,
    minHeight: 52,
    // Border grows 1pt → 2pt on focus; padding compensates so the text never shifts.
    paddingHorizontal: space[5],
  },
});

const stateStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.strong,
    borderWidth: 1,
    color: colors.text.primary,
  },
  focused: {
    backgroundColor: colors.surface.default,
    borderColor: colors.accent.fill,
    borderWidth: 2,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 4, color: colors.accent.subtle },
    ],
    color: colors.text.primary,
    paddingHorizontal: space[5] - 1,
  },
  error: {
    backgroundColor: colors.surface.default,
    borderColor: colors.negative.text,
    borderWidth: 2,
    color: colors.text.primary,
    paddingHorizontal: space[5] - 1,
  },
  disabled: {
    backgroundColor: colors.fill.disabled,
    borderColor: colors.border.default,
    borderWidth: 1,
    color: colors.text.disabled,
  },
});
