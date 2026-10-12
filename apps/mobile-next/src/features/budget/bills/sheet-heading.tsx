import type { ReactNode } from "react";
import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

interface SheetHeadingProps {
  /** Mono caption over the title, e.g. "SAVING FOR" or "DUE TODAY · TUE 1 DEC". */
  readonly stamp: string;
  readonly stampTone?: "tertiary" | "warning";
  readonly title: string;
  /** 26/32 on Add a big payment, 24/30 on Mark paid. */
  readonly size: 24 | 26;
  /** Before the text, e.g. the envelope's tile. */
  readonly leading?: ReactNode;
  /** After the text, e.g. the close disc. */
  readonly trailing?: ReactNode;
}

/** Budget sheet heading: a mono stamp over an 800 title, with optional side slots. */
export function SheetHeading({
  stamp,
  stampTone = "tertiary",
  title,
  size,
  leading,
  trailing,
}: SheetHeadingProps) {
  return (
    <View style={[styles.row, leading ? styles.gap12 : styles.gap10]}>
      {leading}
      <View style={styles.text}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={stampTone} variant="stamp">
          {stamp}
        </Text>
        <NativeText accessibilityRole="header" style={size === 26 ? styles.lg : styles.md}>
          {title}
        </NativeText>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row" },
  gap10: { gap: 10 },
  gap12: { gap: 12 },
  text: { flex: 1, gap: 2 },
  lg: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  md: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
});
