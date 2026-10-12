import { StyleSheet } from "react-native";

import { colors, Icon, layout, PressableScale, radius, type IconName } from "@/ui/trove";

interface RoundButtonProps {
  readonly icon: Extract<IconName, "chevron-left" | "close" | "more">;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

/** The boards draw the back chevron at stroke 2; close and more keep the icon default. */
const STROKE = { "chevron-left": 2, close: 1.75, more: 1.75 } as const;

/** 44pt neutral disc with a 1pt ring, as the budgeting sub-screen and sheet headers draw it. */
export function RoundButton({ icon, accessibilityLabel, onPress }: RoundButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.disc}
    >
      <Icon color={colors.text.primary} name={icon} size={20} strokeWidth={STROKE[icon]} />
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
