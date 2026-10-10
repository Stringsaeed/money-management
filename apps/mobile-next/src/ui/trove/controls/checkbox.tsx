import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { Text } from "../text";
import { colors, layout, radius, space } from "../tokens";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Printed beside the box; the whole row is the touch target. */
  label?: string;
  /** Needed when there is no visible `label`. */
  accessibilityLabel?: string;
  disabled?: boolean;
  testID?: string;
}

const BOX = 22;
/** Lifts the 22pt box to the 44pt touch target when it stands alone. */
const HIT_SLOP = 11;

/** 22pt checkbox, radius.sm. Checked: accent fill with an on-accent tick. */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  accessibilityLabel,
  disabled = false,
  testID,
}: CheckboxProps) {
  const box = (disabled ? disabledBox : enabledBox)[checked ? "checked" : "unchecked"];
  const tick = disabled ? colors.text.disabled : colors.accent.on;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={() => onCheckedChange(!checked)}
      style={label ? styles.row : null}
      testID={testID}
    >
      <View style={[styles.box, box]}>
        {checked ? <Icon color={tick} name="check" size={20} strokeWidth={2.5} /> : null}
      </View>
      {label ? (
        <Text tone={disabled ? "disabled" : "primary"} variant="bodyMd">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.minTouchTarget,
  },
  box: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: BOX,
    justifyContent: "center",
    width: BOX,
  },
});

const enabledBox = StyleSheet.create({
  checked: { backgroundColor: colors.accent.fill },
  unchecked: { borderColor: colors.border.strong, borderWidth: 1.5 },
});

const disabledBox = StyleSheet.create({
  checked: { backgroundColor: colors.fill.disabled },
  unchecked: { borderColor: colors.border.default, borderWidth: 1.5 },
});
