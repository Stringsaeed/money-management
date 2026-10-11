import { StyleSheet, Text as NativeText, type TextProps as NativeTextProps } from "react-native";

import { colors, type, type TypeVariant } from "./tokens";

export type TextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "disabled"
  | "onPaper"
  | "accent"
  | "onAccent"
  | "positive"
  | "negative"
  | "warning";

export interface TextProps extends NativeTextProps {
  /** Nunito for words (`display` … `labelSm`), Plex Mono for numbers (`amount*`, `stamp`, `receipt`). */
  variant?: TypeVariant;
  tone?: TextTone;
}

/** Trove text. Every amount uses an `amount*` variant (or `<Amount />`), never a Nunito style. */
export function Text({ variant = "bodyMd", tone = "primary", style, ...props }: TextProps) {
  return <NativeText {...props} style={[type[variant], toneStyles[tone], style]} />;
}

const toneStyles = StyleSheet.create({
  primary: { color: colors.text.primary },
  secondary: { color: colors.text.secondary },
  tertiary: { color: colors.text.tertiary },
  disabled: { color: colors.text.disabled },
  onPaper: { color: colors.text.onPaper },
  accent: { color: colors.accent.text },
  onAccent: { color: colors.accent.on },
  positive: { color: colors.positive.text },
  negative: { color: colors.negative.text },
  warning: { color: colors.warning.text },
});
