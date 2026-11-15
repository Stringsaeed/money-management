import { StyleSheet, type ColorValue } from "react-native";

import { colors, fonts, radius } from "../tokens";

/** accent: primary fill · negative: destructive fill · outline: 1.5pt ring · text: bare label. */
export type FlowButtonTone = "accent" | "negative" | "outline" | "text";

/**
 * Heights and labels from the budgeting screen boards:
 * bar 52 · Nunito 800 17 (bottom action bar primary) · pair 52 · Nunito 800 16 (paired bar
 * buttons) · cta 54 · Nunito 800 17 (full-width call to action) · link 44 · Nunito 700 15.
 */
export type FlowButtonSize = "bar" | "pair" | "cta" | "link";

export const LABEL_COLOR = {
  accent: colors.accent.on,
  negative: colors.negative.on,
  outline: colors.text.primary,
  text: colors.text.secondary,
} as const satisfies Record<FlowButtonTone, ColorValue>;

export const labelColors = StyleSheet.create({
  accent: { color: LABEL_COLOR.accent },
  negative: { color: LABEL_COLOR.negative },
  outline: { color: LABEL_COLOR.outline },
  text: { color: LABEL_COLOR.text },
  disabled: { color: colors.text.disabled },
});

export const sizeStyles = StyleSheet.create({
  bar: { minHeight: 52, paddingHorizontal: 32 },
  pair: { minHeight: 52, paddingHorizontal: 16 },
  cta: { minHeight: 54, paddingHorizontal: 24 },
  link: { minHeight: 44, paddingHorizontal: 16 },
});

export const labelStyles = StyleSheet.create({
  bar: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22 },
  pair: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21 },
  cta: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22 },
  link: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
});

export const toneStyles = StyleSheet.create({
  accent: { backgroundColor: colors.accent.fill },
  negative: { backgroundColor: colors.negative.text },
  outline: { borderColor: colors.border.default, borderWidth: 1.5 },
  text: {},
});

/** Disabled follows Trove Button: disabled fill and label, rings stay. */
export const disabledStyles = StyleSheet.create({
  accent: { backgroundColor: colors.fill.disabled },
  negative: { backgroundColor: colors.fill.disabled },
  outline: {},
  text: {},
});

export const pressedStyles = StyleSheet.create({
  accent: { backgroundColor: colors.accent.pressed },
  // No pressed negative token: scale feedback only, as on Trove Button's delete.
  negative: {},
  outline: { backgroundColor: colors.fill.neutral },
  text: { backgroundColor: colors.fill.neutral },
});

export const baseStyles = StyleSheet.create({
  body: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
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
  center: { textAlign: "center" },
});

/** Body style for a tone and size; the dimmed fill only applies to a disabled (not loading) button. */
export function flowButtonBody(tone: FlowButtonTone, size: FlowButtonSize, dimmed: boolean) {
  return [
    baseStyles.body,
    sizeStyles[size],
    toneStyles[tone],
    dimmed ? disabledStyles[tone] : null,
  ];
}
