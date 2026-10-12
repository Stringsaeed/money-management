import { StyleSheet, type ColorValue, type TextStyle, type ViewStyle } from "react-native";

import { colors } from "../tokens";

/** Status tone of an attention slot or its action: warning, negative, or the accent. */
export type BudgetTone = "warn" | "neg" | "accent";

const fills = StyleSheet.create({
  warn: { backgroundColor: colors.warning.text },
  neg: { backgroundColor: colors.negative.text },
  accent: { backgroundColor: colors.accent.fill },
});

const subtle = StyleSheet.create({
  warn: { backgroundColor: colors.warning.subtle },
  neg: { backgroundColor: colors.negative.subtle },
  accent: { backgroundColor: colors.accent.subtle },
});

const on = StyleSheet.create({
  warn: { color: colors.warningOn },
  neg: { color: colors.negative.on },
  accent: { color: colors.accent.on },
});

/** Solid tone fill: the slot's edge, its icon disc and its action pill. */
export const TONE_FILL = fills satisfies Record<BudgetTone, ViewStyle>;
/** Tinted background of an attention slot. */
export const TONE_SUBTLE = subtle satisfies Record<BudgetTone, ViewStyle>;
/** Label on a solid tone fill. */
export const TONE_ON = on satisfies Record<BudgetTone, TextStyle>;
/** Icon color on a solid tone fill. */
export const TONE_ON_COLOR = {
  warn: colors.warningOn,
  neg: colors.negative.on,
  accent: colors.accent.on,
} as const satisfies Record<BudgetTone, ColorValue>;
