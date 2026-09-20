import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { ArrowRightIcon } from "phosphor-react-native";
import Animated from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography, shadows } from "@/lib/design-tokens";

interface OnboardingCtaProps {
  disabled?: boolean;
  label: string;
  onPress: VoidFunction;
  /** Hides the trailing arrow — used on the final "open the app" press. */
  showArrow?: boolean;
  testID?: string;
}

/**
 * The single forward action. Press feedback runs on CSS transitions driven by
 * React state, so there are no worklets on the hot path for a plain tap.
 */
export function OnboardingCta({
  disabled = false,
  label,
  onPress,
  showArrow = true,
  testID,
}: OnboardingCtaProps) {
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.container,
          disabled && styles.containerDisabled,
          {
            transform: [{ scale: isPressed ? 0.97 : 1 }],
            boxShadow: isPressed ? shadows.sm : shadows.lg,
            transitionProperty: ["transform", "boxShadow"],
            transitionDuration: 140,
            transitionTimingFunction: "ease-out",
          },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
        {showArrow ? (
          <Animated.View
            style={{
              transform: [{ translateX: isPressed ? 3 : 0 }],
              transitionProperty: ["transform"],
              transitionDuration: 140,
              transitionTimingFunction: "ease-out",
            }}
          >
            <Icon as={ArrowRightIcon} size={18} weight="bold" style={styles.arrowIcon} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: 9999,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[6],
  },
  containerDisabled: {
    opacity: 0.35,
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: 17,
    color: colors.surface,
  },
  arrowIcon: {
    color: colors.surface,
  },
});
