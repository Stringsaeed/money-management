import { useState, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import Animated from "react-native-reanimated";

import { useGraphicPalette } from "@/components/graphics/palette";
import { inputTextStyle } from "@/components/ui/input-style";
import { colors, radii, spacing, typography, shadows } from "@/lib/design-tokens";

interface OnboardingTextFieldProps extends TextInputProps {
  /** Renders the value at display size — used for the starting balance. */
  emphasis?: boolean;
  /** Leading adornment inside the border, e.g. a currency selector. */
  prefix?: ReactNode;
}

/**
 * Text input with an animated focus treatment: the border deepens to ink and a
 * soft lift appears, so the field the keyboard is pointed at is unmistakable.
 */
export function OnboardingTextField({
  emphasis = false,
  onBlur,
  onFocus,
  prefix,
  ...props
}: OnboardingTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const { ink, outline, placeholder } = useGraphicPalette();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: focused ? ink : outline,
          boxShadow: focused ? shadows.md : shadows.none,
          transitionProperty: ["borderColor", "boxShadow"],
          transitionDuration: 200,
          transitionTimingFunction: "ease-out",
        },
      ]}
    >
      {prefix ? <View>{prefix}</View> : null}
      <TextInput
        {...props}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={placeholder}
        style={[
          styles.input,
          emphasis ? styles.inputEmphasis : styles.inputNormal,
          emphasis ? { ...inputTextStyle, fontVariant: ["tabular-nums"] } : inputTextStyle,
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radii["2xl"],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    color: colors.ink,
  },
  inputNormal: {
    paddingVertical: spacing[4],
    fontFamily: typography.fontBodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  inputEmphasis: {
    paddingVertical: spacing[3],
    fontFamily: typography.fontHeadingNormal,
    fontSize: 34,
    lineHeight: 42,
  },
});
