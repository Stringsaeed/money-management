import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing, typography } from "./design-tokens";
import { Icon } from "./icon";
import { Text } from "./text";

export interface SelectRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function SelectRow({ label, value, onPress, disabled = false }: SelectRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.copy}>
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
        {value ? <Text variant="body">{value}</Text> : null}
      </View>
      <Icon name="caret-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: spacing[14],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  label: {
    color: colors.foreground,
    fontFamily: typography.fontBodySemibold,
  },
  pressed: {
    backgroundColor: colors.surfaceDim,
  },
  disabled: {
    opacity: 0.48,
  },
});
