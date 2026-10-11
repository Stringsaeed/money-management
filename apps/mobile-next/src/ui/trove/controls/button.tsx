import { View, type GestureResponderEvent } from "react-native";

import type { IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { ButtonContent } from "./button-content";
import {
  baseStyles,
  disabledFill,
  HIT_SLOP,
  pressedStyles,
  sizeStyles,
  variantStyles,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";

export interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** primary: accent fill · secondary: neutral · tertiary: text only · delete: negative tint. */
  variant?: ButtonVariant;
  /** lg 52 · md 44 · sm 36 (hitSlop 4 keeps the 44pt target). */
  size?: ButtonSize;
  /** Shows a spinner, keeps the width, and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Optional leading icon. */
  icon?: IconName;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const blocked = disabled || loading;
  const dimmed = disabled && !loading;

  return (
    <View style={fullWidth ? baseStyles.wrapFull : baseStyles.wrapFit}>
      <PressableScale
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked, busy: loading }}
        disabled={blocked}
        hitSlop={HIT_SLOP[size]}
        onPress={onPress}
        pressedStyle={pressedStyles[variant]}
        style={[
          baseStyles.body,
          sizeStyles[size],
          variantStyles[variant],
          disabledFill(variant, dimmed),
        ]}
        testID={testID}
      >
        <ButtonContent
          disabled={dimmed}
          icon={icon}
          label={label}
          loading={loading}
          size={size}
          variant={variant}
        />
      </PressableScale>
    </View>
  );
}
