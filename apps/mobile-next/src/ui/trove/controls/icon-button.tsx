import { StyleSheet, View, type ColorValue, type GestureResponderEvent } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, layout, radius } from "../tokens";

export type IconButtonVariant = "neutral" | "ghost" | "primary";

export interface IconButtonProps {
  icon: IconName;
  /** Icon-only controls need a spoken name. */
  accessibilityLabel: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** neutral: fill.neutral disc · ghost: bare icon · primary: accent disc. */
  variant?: IconButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

const ICON_COLOR = {
  neutral: colors.text.primary,
  ghost: colors.text.primary,
  primary: colors.accent.on,
} as const satisfies Record<IconButtonVariant, ColorValue>;

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = "neutral",
  disabled = false,
  accessibilityHint,
  testID,
}: IconButtonProps) {
  const color = disabled ? colors.text.disabled : ICON_COLOR[variant];
  const fill = disabled && variant !== "ghost" ? styles.disabled : variantStyles[variant];

  return (
    <View style={styles.wrap}>
      <PressableScale
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        pressedStyle={pressedStyles[variant]}
        style={[styles.body, fill]}
        testID={testID}
      >
        <Icon color={color} name={icon} size={20} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start" },
  body: {
    alignItems: "center",
    borderRadius: radius.full,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  disabled: { backgroundColor: colors.fill.disabled },
});

const variantStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.fill.neutral },
  ghost: { backgroundColor: "transparent" },
  primary: { backgroundColor: colors.accent.fill },
});

const pressedStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.border.subtle },
  ghost: { backgroundColor: colors.fill.neutral },
  primary: { backgroundColor: colors.accent.pressed },
});
