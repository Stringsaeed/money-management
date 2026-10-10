import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { Icon } from "../icon";
import { useKeyboardAccessory } from "../pickers/use-keyboard-accessory";
import { colors, layout, motion, radius, space, type } from "../tokens";

export interface SearchFieldProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "placeholder"
> {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  /** iOS only. Added automatically for number-pad and similar keyboards; false opts out. */
  keyboardAccessory?: boolean;
  /** Previous / next arrows on the done bar. The arrows show only when one is given. */
  onPreviousField?: () => void;
  onNextField?: () => void;
}

/** Pill search field, 44pt, on fill.neutral. Shows a clear button while it holds text. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  keyboardAccessory,
  onPreviousField,
  onNextField,
  ...props
}: SearchFieldProps) {
  const accessory = useKeyboardAccessory({
    keyboardType: props.keyboardType,
    inputAccessoryViewID: props.inputAccessoryViewID,
    enabled: keyboardAccessory,
    onPrevious: onPreviousField,
    onNext: onNextField,
  });
  return (
    <View style={styles.field}>
      <Icon color={colors.text.secondary} name="search" size={20} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        placeholderTextColor={colors.text.secondary}
        returnKeyType="search"
        selectionColor={colors.accent.fill}
        {...props}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        inputAccessoryViewID={accessory.inputAccessoryViewID}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
        value={value}
      />
      {accessory.bar}
      {value ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={motion.hitSlop}
          onPress={() => onChangeText("")}
        >
          <Icon color={colors.text.secondary} name="close" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: space[2],
    minHeight: layout.minTouchTarget,
    paddingHorizontal: space[4],
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: type.bodyMd.fontFamily,
    fontSize: type.bodyMd.fontSize,
    minHeight: layout.minTouchTarget,
    minWidth: 0,
    paddingVertical: 0,
  },
});
