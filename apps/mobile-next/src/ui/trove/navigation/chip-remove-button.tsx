import { StyleSheet } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, motion, space } from "../tokens";

export interface ChipRemoveButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** The "x" at the trailing edge of a removable chip. */
export function ChipRemoveButton({ label, selected, onPress }: ChipRemoveButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={`Remove ${label}`}
      accessibilityRole="button"
      hitSlop={motion.hitSlop}
      onPress={onPress}
      style={styles.button}
    >
      <Icon color={selected ? colors.accent.text : colors.text.secondary} name="close" size={16} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", justifyContent: "center", paddingRight: space[3] },
});
