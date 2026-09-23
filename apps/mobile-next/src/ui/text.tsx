import type { ReactNode } from "react";
import { StyleSheet, Text as NativeText, type TextProps as NativeTextProps } from "react-native";

import { colors, typography } from "./design-tokens";

export type TextVariant = "body" | "caption" | "label" | "title" | "headline" | "amount";

export interface TextProps extends NativeTextProps {
  children?: ReactNode;
  variant?: TextVariant;
}

const styles = StyleSheet.create({
  base: {
    color: colors.foreground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
  },
  body: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    lineHeight: 22,
  },
  caption: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    lineHeight: 18,
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    lineHeight: 18,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textXl,
    lineHeight: 28,
  },
  headline: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text2xl,
    lineHeight: 32,
  },
  amount: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text4xl,
    fontVariant: ["tabular-nums"],
    letterSpacing: typography.trackingTight,
    lineHeight: 44,
  },
});

export function Text({ variant = "body", style, ...props }: TextProps) {
  return <NativeText {...props} style={[styles.base, styles[variant], style]} />;
}
