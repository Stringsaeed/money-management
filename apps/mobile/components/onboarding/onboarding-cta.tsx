import { useState } from "react";
import { Pressable } from "react-native";
import { ArrowRightIcon } from "phosphor-react-native";
import Animated from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

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
        className={cn(
          "h-14 flex-row items-center justify-center gap-2 rounded-full bg-ink px-6",
          disabled && "opacity-35",
        )}
        style={{
          transform: [{ scale: isPressed ? 0.97 : 1 }],
          boxShadow: isPressed
            ? "0px 2px 6px rgba(28, 27, 26, 0.10)"
            : "0px 10px 24px rgba(28, 27, 26, 0.16)",
          transitionProperty: ["transform", "boxShadow"],
          transitionDuration: 140,
          transitionTimingFunction: "ease-out",
        }}
      >
        <Text className="font-body-semibold text-[17px] text-surface">{label}</Text>
        {showArrow ? (
          <Animated.View
            style={{
              transform: [{ translateX: isPressed ? 3 : 0 }],
              transitionProperty: ["transform"],
              transitionDuration: 140,
              transitionTimingFunction: "ease-out",
            }}
          >
            <Icon as={ArrowRightIcon} className="text-surface" size={18} weight="bold" />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
