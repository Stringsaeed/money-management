import { StyleSheet, type ColorValue } from "react-native";

import { colors, radius, space } from "../tokens";
import type { TextTone } from "../text";
import type { TypeVariant } from "../tokens";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "delete";
export type ButtonSize = "lg" | "md" | "sm";

/** Label tone and matching icon color per variant. Disabled swaps both for text.disabled. */
export const LABEL = {
  primary: { tone: "onAccent", color: colors.accent.on },
  secondary: { tone: "primary", color: colors.text.primary },
  tertiary: { tone: "accent", color: colors.accent.text },
  delete: { tone: "negative", color: colors.negative.text },
} as const satisfies Record<ButtonVariant, { tone: TextTone; color: ColorValue }>;

export const LABEL_VARIANT = {
  lg: "labelLg",
  md: "labelMd",
  sm: "labelSm",
} as const satisfies Record<ButtonSize, TypeVariant>;

export const ICON_SIZE = { lg: 20, md: 20, sm: 16 } as const satisfies Record<ButtonSize, number>;

/** sm is 36pt tall; hitSlop 4 on each side reaches the 44pt target. */
export const HIT_SLOP = { lg: 0, md: 0, sm: 4 } as const satisfies Record<ButtonSize, number>;

export const sizeStyles = StyleSheet.create({
  lg: { minHeight: 52, paddingHorizontal: space[5] },
  md: { minHeight: 44, paddingHorizontal: space[4] },
  // The artboard uses 14pt horizontal padding on the small button.
  sm: { minHeight: 36, paddingHorizontal: 14 },
});

export const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent.fill },
  secondary: { backgroundColor: colors.fill.neutral },
  tertiary: { backgroundColor: "transparent", paddingHorizontal: space[3] },
  delete: { backgroundColor: colors.negative.subtle },
  disabled: { backgroundColor: colors.fill.disabled },
  disabledTertiary: { backgroundColor: "transparent" },
});

export const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent.pressed },
  // No darker neutral token: step to the subtle border tone, which reads as a press on both modes.
  secondary: { backgroundColor: colors.border.subtle },
  tertiary: { backgroundColor: colors.accent.subtle },
  // No pressed negative token: delete gives scale feedback only.
  delete: { backgroundColor: colors.negative.subtle },
});

export const baseStyles = StyleSheet.create({
  body: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[2],
    justifyContent: "center",
  },
  hidden: { opacity: 0 },
  spinner: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  wrapFit: { alignSelf: "flex-start" },
  wrapFull: { alignSelf: "stretch" },
});

/** Fill style layered over the variant: the dimmed look only applies to a disabled (not loading) button. */
export function disabledFill(variant: ButtonVariant, dimmed: boolean) {
  if (!dimmed) return null;
  return variant === "tertiary" ? variantStyles.disabledTertiary : variantStyles.disabled;
}
