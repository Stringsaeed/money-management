import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { Icon } from "../icon";
import { colors, layout, motion, radius, space, type } from "../tokens";

export interface SearchFieldProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "placeholder"
> {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

/** Pill search field, 44pt, on fill.neutral. Shows a clear button while it holds text. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  ...props
}: SearchFieldProps) {
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
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
        value={value}
      />
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
