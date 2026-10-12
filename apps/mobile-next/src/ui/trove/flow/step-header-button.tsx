import { StyleSheet } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, layout, radius } from "../tokens";

export type StepHeaderLeading = "back" | "close";

interface StepHeaderButtonProps {
  kind: StepHeaderLeading;
  onPress: () => void;
  accessibilityLabel?: string;
}

const ICON = {
  // The setup boards draw the back chevron at stroke 2; the close cross keeps the 1.75 default.
  back: { name: "chevron-left", strokeWidth: 2, label: "Back" },
  close: { name: "close", strokeWidth: 1.75, label: "Close" },
} as const;

/** 44pt neutral disc with a 1pt ring: back chevron or close cross. */
export function StepHeaderButton({ kind, onPress, accessibilityLabel }: StepHeaderButtonProps) {
  const icon = ICON[kind];

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? icon.label}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.disc}
    >
      <Icon color={colors.text.primary} name={icon.name} size={20} strokeWidth={icon.strokeWidth} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  pressed: { backgroundColor: colors.border.subtle },
});
