import { StyleSheet, Text as NativeText } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import {
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  LeaderLine,
  motion,
  RECEIPT_PADDING,
  ReceiptSlip,
  troveTransition,
} from "@/ui/trove";

import type { AfterLine } from "./cover-display";

/** What a move leaves behind, printed on a slip: AFTER, each place, and Safe to spend marked. */
export function AfterReceipt({ lines }: { readonly lines: readonly AfterLine[] }) {
  const reducedMotion = useReducedMotion();
  return (
    <EaseView
      accessibilityLiveRegion="polite"
      animate={{ opacity: 1 }}
      initialAnimate={{ opacity: 0 }}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <ReceiptSlip gap={6} padding={RECEIPT_PADDING.screen} radius={12} tearDepth={8}>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label}>
          AFTER
        </NativeText>
        {lines.map((line, index) =>
          line.total ? (
            <LeaderLine
              key={`${index}:${line.label}`}
              label={line.label}
              marker
              value={line.value}
              valueWeight="label"
              weight="bold"
            />
          ) : (
            <LeaderLine key={`${index}:${line.label}`} label={line.label} value={line.value} />
          ),
        )}
      </ReceiptSlip>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.paper.textTertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 18,
  },
});
