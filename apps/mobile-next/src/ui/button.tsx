import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { EaseView } from "react-native-ease";

import { colors, radii, spacing, typography } from "./design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "./motion";
import { Text } from "./text";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={onPress}
      pressRetentionOffset={12}
    >
      {({ pressed }) => (
        <EaseView
          animate={{ opacity: isDisabled ? 0.48 : pressed ? 0.86 : 1, scale: pressed ? 0.98 : 1 }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={[styles.base, styles[variant], style]}
        >
          {loading ? (
            <ActivityIndicator
              color={
                variant === "primary"
                  ? colors.primaryForeground
                  : variant === "destructive"
                    ? colors.brandForeground
                    : colors.foreground
              }
            />
          ) : (
            <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
          )}
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.lg,
    height: spacing[11],
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
  },
  primaryLabel: {
    color: colors.primaryForeground,
  },
  secondaryLabel: {
    color: colors.secondaryForeground,
  },
  ghostLabel: {
    color: colors.foreground,
  },
  destructiveLabel: {
    color: colors.brandForeground,
  },
});
