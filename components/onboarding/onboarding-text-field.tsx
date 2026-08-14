import { useState, type ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import Animated from "react-native-reanimated";

import { useGraphicPalette } from "@/components/graphics/palette";
import { inputTextStyle } from "@/components/ui/input-style";
import { cn } from "@/lib/utils";

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
      className="flex-row items-center gap-3 rounded-2xl bg-surface px-4"
      style={{
        borderWidth: 1.5,
        borderColor: focused ? ink : outline,
        boxShadow: focused
          ? "0px 8px 20px rgba(44, 95, 71, 0.10)"
          : "0px 0px 0px rgba(44, 95, 71, 0)",
        transitionProperty: ["borderColor", "boxShadow"],
        transitionDuration: 200,
        transitionTimingFunction: "ease-out",
      }}
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
        className={cn(
          "flex-1 text-ink",
          emphasis
            ? "py-3 font-heading-normal text-[34px] leading-[42px]"
            : "py-4 font-body-medium text-[17px] leading-[22px]",
        )}
        style={emphasis ? { ...inputTextStyle, fontVariant: ["tabular-nums"] } : inputTextStyle}
      />
    </Animated.View>
  );
}
