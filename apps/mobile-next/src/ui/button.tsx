import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { EaseView } from "react-native-ease";
import Gradient from "react-native-linear-gradient";

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
  const [focused, setFocused] = useState(false);
  const foregroundColor =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "destructive"
        ? colors.brandForeground
        : variant === "secondary"
          ? colors.secondaryForeground
          : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      pressRetentionOffset={12}
    >
      {({ pressed }) => (
        <EaseView
          animate={{
            opacity: isDisabled ? 0.48 : pressed ? 0.86 : 1,
            scale: pressed && !reducedMotion ? 0.98 : 1,
          }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={[styles.base, styles[variant], style]}
        >
          {variant !== "ghost" ? (
            <>
              <Gradient colors={GEL_COLORS} locations={GEL_LOCATIONS} style={styles.gel} />
              <Gradient colors={GLOSS_COLORS} style={styles.gloss} />
              <View style={styles.innerRing} />
            </>
          ) : null}
          {focused && !isDisabled ? <View style={styles.focusRing} /> : null}
          {loading ? (
            <ActivityIndicator color={foregroundColor} />
          ) : (
            <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
          )}
        </EaseView>
      )}
    </Pressable>
  );
}

// Aqua's five-stop gel and upper reflection sit over native semantic backgrounds.
// Neutral RGBA highlights let the underlying day/night colors resolve natively
// without duplicating the palette or subscribing to appearance changes in JS.
const GEL_COLORS = [
  "rgba(255, 255, 255, 0.38)",
  "rgba(255, 255, 255, 0.06)",
  "rgba(0, 0, 0, 0.12)",
  "rgba(255, 255, 255, 0.04)",
  "rgba(255, 255, 255, 0.28)",
];
const GEL_LOCATIONS = [0, 0.42, 0.5, 0.78, 1];
const GLOSS_COLORS = ["rgba(255, 255, 255, 0.64)", "rgba(255, 255, 255, 0.02)"];

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.full,
    borderWidth: 1,
    minHeight: spacing[11],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2.5],
    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.18)",
  },
  gel: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.full,
  },
  gloss: {
    position: "absolute",
    top: spacing[0.5],
    left: "7%",
    right: "7%",
    height: "46%",
    borderRadius: radii.full,
  },
  innerRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.35)",
    boxShadow:
      "inset 0px 1px 1px rgba(255, 255, 255, 0.5), inset 0px -3px 7px rgba(255, 255, 255, 0.2)",
  },
  focusRing: {
    position: "absolute",
    top: -spacing[1],
    bottom: -spacing[1],
    left: -spacing[1],
    right: -spacing[1],
    borderRadius: radii.full,
    borderColor: colors.sage,
    borderWidth: spacing[0.5],
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryForeground,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    boxShadow: "none",
  },
  destructive: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    textAlign: "center",
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
