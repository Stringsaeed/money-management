import { Pressable, StyleSheet } from "react-native";

import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";

interface RemovableChipProps {
  readonly label: string;
  readonly onRemove: () => void;
}

/** An applied filter; the whole chip is the remove target so it stays easy to hit. */
export function RemovableChip({ label, onRemove }: RemovableChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove filter ${label}`}
      hitSlop={4}
      onPress={onRemove}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Icon name="x" size={12} weight="bold" color={colors.accentForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[1.5],
    height: spacing[8],
    maxWidth: 200,
    paddingLeft: spacing[3],
    paddingRight: spacing[2.5],
  },
  pressed: { opacity: 0.6 },
  label: {
    color: colors.accentForeground,
    flexShrink: 1,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
});
