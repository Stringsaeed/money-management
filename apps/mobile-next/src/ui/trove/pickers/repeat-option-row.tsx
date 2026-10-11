import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, fonts, layout, space } from "../tokens";

interface RepeatOptionRowProps {
  label: string;
  checked: boolean;
  last: boolean;
  onPress: () => void;
}

/** One radio row: sentence on the left, accent tick when picked. 44pt, hairline divider. */
export function RepeatOptionRow({ label, checked, last, onPress }: RepeatOptionRowProps) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      onPress={onPress}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={[styles.row, !last && styles.divider]}
    >
      <Text style={checked ? styles.checkedLabel : undefined} variant="labelMd">
        {label}
      </Text>
      <View style={styles.spacer} />
      {checked ? (
        <Icon color={colors.accent.text} name="check" size={20} strokeWidth={2.5} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3] - 2,
    minHeight: layout.minTouchTarget,
  },
  divider: { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 },
  pressed: { backgroundColor: colors.fill.neutral },
  checkedLabel: { fontFamily: fonts.extrabold },
  spacer: { flex: 1 },
});
