import { StyleSheet } from "react-native";

import { colors, fonts, radius } from "../tokens";
import { chipPadding, type SelectChipSize, type SelectChipVariant } from "./utils";

export const chipStyles = StyleSheet.create({
  body: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
  },
  md: { height: 38 },
  lg: { height: 40 },
});

/** Fill and ring per variant and state. Solid fills keep a same-colour 1pt ring so nothing shifts. */
export const surfaceStyles = StyleSheet.create({
  solidIdle: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  solidOn: { backgroundColor: colors.accent.fill, borderColor: colors.accent.fill, borderWidth: 1 },
  envelopeIdle: {
    backgroundColor: "transparent",
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  envelopeOn: {
    backgroundColor: colors.accent.fill,
    borderColor: colors.accent.fill,
    borderWidth: 1,
  },
  checkIdle: { backgroundColor: "transparent", borderColor: colors.border.default, borderWidth: 1 },
  checkOn: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.fill,
    borderWidth: 1.5,
  },
  // Dashed works on iOS when every side is dashed (one-sided dashes do not render).
  add: {
    backgroundColor: "transparent",
    borderColor: colors.border.default,
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
});

export const pressedStyles = StyleSheet.create({
  idle: { backgroundColor: colors.fill.neutral },
  solidIdle: { backgroundColor: colors.border.subtle },
  on: { backgroundColor: colors.accent.pressed },
});

export const labelStyles = StyleSheet.create({
  /** Payday chips: Nunito 700 15. */
  solidLg: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  /** Ticked envelopes, add chips, and the 38pt solid chip: Nunito 700 14. */
  regular: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  /** Quick add envelope chips: Nunito 800 14. */
  envelope: { fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 19 },
});

export const toneStyles = StyleSheet.create({
  primary: { color: colors.text.primary },
  secondary: { color: colors.text.secondary },
  onAccent: { color: colors.accent.on },
});

export const partStyles = StyleSheet.create({
  meta: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 14, opacity: 0.8 },
  tick: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  tickHidden: { opacity: 0 },
});

/** Emoji size by chip size: 16 on 38pt chips, 17 on 40pt. */
export const emojiStyles = StyleSheet.create({
  md: { fontSize: 16, lineHeight: 20 },
  lg: { fontSize: 17, lineHeight: 21 },
});

function surfaceKey(variant: SelectChipVariant, selected: boolean) {
  if (variant === "add") return "add";
  return `${variant}${selected ? "On" : "Idle"}` as const;
}

/** Body style: shape, height, fill and ring, and the padding that keeps the label in place. */
export function chipBody(
  variant: SelectChipVariant,
  size: SelectChipSize,
  hasEmoji: boolean,
  selected: boolean,
) {
  return [
    chipStyles.body,
    chipStyles[size],
    surfaceStyles[surfaceKey(variant, selected)],
    chipPadding(variant, size, hasEmoji, selected),
  ];
}

/** Pressed fill: accent.pressed on a filled chip, a neutral step otherwise. */
export function chipPressedStyle(variant: SelectChipVariant, selected: boolean) {
  if (selected && variant !== "check") return pressedStyles.on;
  return variant === "solid" ? pressedStyles.solidIdle : pressedStyles.idle;
}

/** Label face: payday chips 700 15, envelope chips 800 14, the rest 700 14. */
export function chipLabelStyle(variant: SelectChipVariant, size: SelectChipSize) {
  if (variant === "envelope") return labelStyles.envelope;
  return variant === "solid" && size === "lg" ? labelStyles.solidLg : labelStyles.regular;
}

/** Ink: on-accent over a filled chip, secondary on the add chip, primary otherwise. */
export function chipToneStyle(variant: SelectChipVariant, selected: boolean) {
  if (variant === "add") return toneStyles.secondary;
  const filled = selected && (variant === "solid" || variant === "envelope");
  return filled ? toneStyles.onAccent : toneStyles.primary;
}
