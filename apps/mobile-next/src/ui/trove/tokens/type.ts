import { Platform, type TextStyle } from "react-native";

/**
 * Two voices. Nunito speaks — titles, labels, sentences. IBM Plex Mono counts — every
 * amount, date stamp and receipt line, so figures always line up.
 *
 * Android won't synthesize weights for custom fonts, so each weight is its own family.
 * Nunito is embedded natively on iOS (PostScript names) and loaded by `useFonts` on
 * Android; Plex Mono is loaded by `useFonts` on both.
 */
export const fonts = {
  regular: Platform.select({ ios: "Nunito-Regular", default: "Nunito_400Regular" }),
  bold: Platform.select({ ios: "Nunito-Bold", default: "Nunito_700Bold" }),
  extrabold: Platform.select({ ios: "Nunito-ExtraBold", default: "Nunito_800ExtraBold" }),
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  monoSemibold: "IBMPlexMono_600SemiBold",
} as const;

const t = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing = 0) =>
  ({ fontFamily, fontSize, lineHeight, letterSpacing }) satisfies TextStyle;

export const type = {
  display: t(fonts.extrabold, 34, 40, -0.7),
  titleLg: t(fonts.extrabold, 28, 34, -0.5),
  titleMd: t(fonts.extrabold, 20, 26, -0.2),
  titleSm: t(fonts.extrabold, 17, 22),
  bodyLg: t(fonts.regular, 17, 24),
  bodyMd: t(fonts.regular, 15, 22),
  bodySm: t(fonts.regular, 13, 18),
  labelLg: t(fonts.bold, 17, 22),
  labelMd: t(fonts.bold, 15, 20),
  labelSm: t(fonts.bold, 13, 16, 0.1),
  amountHero: t(fonts.monoMedium, 44, 48, -2),
  amountLg: t(fonts.monoMedium, 24, 30, -0.5),
  amountMd: t(fonts.monoMedium, 15, 20),
  amountSm: t(fonts.monoMedium, 13, 18),
  stamp: { ...t(fonts.monoSemibold, 11, 14, 1.2), textTransform: "uppercase" },
  receipt: t(fonts.mono, 13, 18),
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** Dense rows cap Dynamic Type here so amounts and labels keep their columns. */
export const DENSE_MAX_FONT_SCALE = 1.4;
