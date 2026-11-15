import { StyleSheet } from "react-native";

import { colors, fonts, radius, space } from "../tokens";

const MD_PADDING_X = 14;
const LG_PADDING = space[4];

/** Board rings are inset box-shadows; native borders take space, so the padding gives it back. */
export const cardStyles = StyleSheet.create({
  body: {
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: space[3],
  },
  md: { alignItems: "center", minHeight: 54, paddingVertical: 10 },
  lg: { alignItems: "flex-start" },
  idle: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.fill,
    borderWidth: 1.5,
  },
  mdIdle: { paddingHorizontal: MD_PADDING_X - 1 },
  mdSelected: { paddingHorizontal: MD_PADDING_X - 1.5 },
  lgIdle: { padding: LG_PADDING - 1 },
  lgSelected: { padding: LG_PADDING - 1.5 },
  pressed: { backgroundColor: colors.fill.neutral },
  disabled: { opacity: 0.5 },
});

export const textStyles = StyleSheet.create({
  /** Leftovers choices: Nunito 800 16/22. */
  titleLg: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 16,
    lineHeight: 22,
  },
  subText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17 },
  subMono: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
  subLg: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  emojiMd: { fontSize: 18, lineHeight: 24 },
  emojiLg: { fontSize: 16, lineHeight: 22 },
});

export const subToneStyles = StyleSheet.create({
  secondary: { color: colors.text.secondary },
  tertiary: { color: colors.text.tertiary },
  accent: { color: colors.accent.text },
  warning: { color: colors.warning.text },
});

export const layoutStyles = StyleSheet.create({
  texts: { flex: 1, minWidth: 0 },
  textsLg: { flex: 1, gap: space[1], minWidth: 0 },
  titleRow: { alignItems: "center", flexDirection: "row", gap: space[2] },
  dotLg: { marginTop: 1 },
  slot: { alignSelf: "flex-start", marginTop: space[1] },
});

export type RadioCardSize = "md" | "lg";
export type RadioCardSubTone = "secondary" | "tertiary" | "accent" | "warning";

const RING = {
  md: { idle: cardStyles.mdIdle, selected: cardStyles.mdSelected },
  lg: { idle: cardStyles.lgIdle, selected: cardStyles.lgSelected },
} as const;

/** Card body: layout per size, fill and ring per state, padding that gives the ring back. */
export function radioCardBody(size: RadioCardSize, selected: boolean, disabled: boolean) {
  const state = selected ? "selected" : "idle";
  return [
    cardStyles.body,
    cardStyles[size],
    cardStyles[state],
    RING[size][state],
    disabled ? cardStyles.disabled : null,
  ];
}

/** Sub line face and ink: mono caps lines default to tertiary, sentences to secondary. */
export function radioSubStyle(mono: boolean, tone: RadioCardSubTone | undefined) {
  const face = mono ? textStyles.subMono : textStyles.subText;
  return [face, subToneStyles[tone ?? (mono ? "tertiary" : "secondary")]];
}
