import { StyleSheet } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, layout, radius } from "../tokens";

export type RoundButtonIcon = "back" | "close" | "more";

export interface RoundButtonProps {
  icon: RoundButtonIcon;
  onPress: () => void;
  /** Overrides "Back" / "Close" / "More". */
  accessibilityLabel?: string;
}

const ICON = {
  // The boards draw the back chevron at stroke 2; close and more keep the 1.75 default.
  back: { name: "chevron-left", strokeWidth: 2, label: "Back" },
  close: { name: "close", strokeWidth: 1.75, label: "Close" },
  more: { name: "more", strokeWidth: 1.75, label: "More" },
} as const;

/** 44pt neutral disc with a 1pt ring: back chevron, close cross, or ••• more. */
export function RoundButton({ icon, onPress, accessibilityLabel }: RoundButtonProps) {
  const glyph = ICON[icon];

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? glyph.label}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.disc}
    >
      <Icon
        color={colors.text.primary}
        name={glyph.name}
        size={20}
        strokeWidth={glyph.strokeWidth}
      />
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
    flexShrink: 0,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  pressed: { backgroundColor: colors.border.subtle },
});
