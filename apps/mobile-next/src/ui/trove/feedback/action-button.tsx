import { StyleSheet } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, radius, space } from "../tokens";

export type ActionButtonVariant = "primary" | "destructive" | "ghost";
export type ActionButtonSize = "compact" | "regular";

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ActionButtonVariant;
  /** `compact` is 44 high (empty states); `regular` is 48 high (dialogs). */
  size?: ActionButtonSize;
}

/**
 * Minimal private button for feedback surfaces. The integration pass swaps it for the shared
 * Trove Button.
 */
export function ActionButton({
  label,
  onPress,
  variant = "primary",
  size = "regular",
}: ActionButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={pressedStyles[variant]}
      style={[styles.base, sizeStyles[size], variantStyles[variant]]}
    >
      <Text
        numberOfLines={1}
        style={labelStyles[variant]}
        tone={variant === "primary" ? "onAccent" : "primary"}
        variant={size === "compact" ? "labelMd" : "labelLg"}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    justifyContent: "center",
    paddingHorizontal: space[5],
  },
});

const sizeStyles = StyleSheet.create({
  compact: { minHeight: 44 },
  regular: { minHeight: 48 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent.fill },
  destructive: { backgroundColor: colors.negative.text },
  ghost: { backgroundColor: "transparent" },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent.pressed },
  destructive: { opacity: 0.88 },
  ghost: { backgroundColor: colors.fill.neutral },
});

const labelStyles = StyleSheet.create({
  primary: {},
  destructive: { color: colors.negative.on },
  ghost: {},
});
