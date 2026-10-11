import { Pressable, StyleSheet } from "react-native";

import { Text } from "../text";
import { layout, space } from "../tokens";
import { CheckboxBox } from "./checkbox-box";

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
      <CheckboxBox checked={checked} disabled={disabled} />
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
});
