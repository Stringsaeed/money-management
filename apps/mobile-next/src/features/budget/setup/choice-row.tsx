import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

interface ChoiceRowProps {
  readonly label: string;
  readonly detail?: string;
  readonly note?: string;
  readonly ticked: boolean;
  /** Unavailable rows show their `note` and cannot be changed. */
  readonly disabled?: boolean;
  readonly onPress?: () => void;
}

/** A tick-box row used for funding accounts and the What it's for checklist. */
export function ChoiceRow({
  label,
  detail,
  note,
  ticked,
  disabled = false,
  onPress,
}: ChoiceRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ticked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.box, ticked && styles.boxTicked]}>
        {ticked ? <Icon name="check" size={14} color={colors.primaryForeground} /> : null}
      </View>
      <View style={styles.copy}>
        <Text>{label}</Text>
        {note ? <Text variant="caption">{note}</Text> : null}
      </View>
      {detail ? <Text variant="caption">{detail}</Text> : null}
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
    gap: spacing[3],
    minHeight: spacing[14],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  pressed: { backgroundColor: colors.surfaceDim },
  disabled: { opacity: 0.56 },
  box: {
    alignItems: "center",
    borderColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1.5,
    height: spacing[6],
    justifyContent: "center",
    width: spacing[6],
  },
  boxTicked: { backgroundColor: colors.primary, borderColor: colors.primary },
  copy: { flex: 1, gap: spacing[0.5] },
});
