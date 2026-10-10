import { StyleSheet } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, layout, radius } from "../tokens";

export type HeaderDiscTone = "negative" | "neutral" | "accent";

interface HeaderDiscProps {
  icon: IconName;
  tone: HeaderDiscTone;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

const ICON_COLOR = {
  negative: colors.negative.text,
  neutral: colors.text.primary,
  accent: colors.accent.on,
} as const satisfies Record<HeaderDiscTone, typeof colors.text.primary>;

/** A 44pt round header action. Disabled discs drop to neutral + ring with text.disabled. */
export function HeaderDisc({
  icon,
  tone,
  accessibilityLabel,
  disabled = false,
  onPress,
  testID,
}: HeaderDiscProps) {
  const toneStyle = disabled ? styles.disabled : toneStyles[tone];
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedStyle={pressedStyles[tone]}
      style={[styles.disc, toneStyle]}
      testID={testID}
    >
      <Icon color={disabled ? colors.text.disabled : ICON_COLOR[tone]} name={icon} size={20} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    borderRadius: radius.full,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  disabled: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
});

const toneStyles = StyleSheet.create({
  negative: { backgroundColor: colors.negative.subtle },
  neutral: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  accent: { backgroundColor: colors.accent.fill },
});

const pressedStyles = StyleSheet.create({
  negative: { backgroundColor: colors.negative.subtle, opacity: 0.8 },
  neutral: { backgroundColor: colors.border.subtle },
  accent: { backgroundColor: colors.accent.pressed },
});
