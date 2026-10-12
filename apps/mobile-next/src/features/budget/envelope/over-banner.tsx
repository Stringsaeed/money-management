import { StyleSheet, Text as NativeText, View } from "react-native";
import { EaseView } from "react-native-ease";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { useReducedMotion } from "@/ui/motion";
import { colors, DENSE_MAX_FONT_SCALE, fonts, motion, troveTransition } from "@/ui/trove";

import { overBannerText } from "./envelope-display";

interface OverBannerProps {
  readonly overMinor: number;
  readonly group: V2EnvelopeGroup;
  readonly currency: string;
  /** Some of the overspend went on a credit card. */
  readonly onCard: boolean;
}

/** O1: said in words, not only colour, on a negative tint with a 4pt edge. */
export function OverBanner({ overMinor, group, currency, onCard }: OverBannerProps) {
  const reducedMotion = useReducedMotion();
  return (
    <EaseView
      accessibilityRole="alert"
      accessible
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: -4 }}
      style={styles.banner}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.edge} />
      <NativeText
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.text, styles.glyph]}
      >
        ⚠︎
      </NativeText>
      <View style={styles.copy}>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
          {overBannerText(group, overMinor, currency)}
        </NativeText>
        {onCard ? (
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.note}>
            Part of this was paid by card and is kept for your card bill.
          </NativeText>
        ) : null}
      </View>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.negative.subtle,
    borderCurve: "continuous",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 12,
  },
  // The board's `inset 4px 0 0` edge: drawn inside the padding, clipped by the radius.
  edge: {
    backgroundColor: colors.negative.text,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
  copy: { flex: 1, gap: 4 },
  text: { color: colors.text.primary, fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
  glyph: { color: colors.negative.text },
  note: { color: colors.text.secondary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
});
