import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  colors,
  DashedRule,
  DENSE_MAX_FONT_SCALE,
  fonts,
  RECEIPT_PADDING,
  ReceiptSlip,
  space,
} from "@/ui/trove";

import { SlipLink } from "./slip-link";
import { figure, leftToPlanMessage, leftToPlanState, moneyLabel } from "./setup-copy";

interface LeftToPlanSlipProps {
  readonly currency: string;
  /** Money you have; null while the plan cannot be calculated. */
  readonly cashMinor: number | null;
  /** The engine's Not planned yet for this draft; null while it cannot be calculated. */
  readonly leftMinor: number | null;
  readonly onSuggest: () => void;
  readonly onClear: () => void;
}

/**
 * S4's receipt slip: LEFT TO PLAN with its "14,200 − 13,470" sum, the figure on a lime marker
 * (a warning marker once over), what it means, and the Use suggestions / Clear all links.
 */
export function LeftToPlanSlip({
  currency,
  cashMinor,
  leftMinor,
  onSuggest,
  onClear,
}: LeftToPlanSlipProps) {
  const known = leftMinor !== null && cashMinor !== null;
  const state = leftMinor === null ? "some" : leftToPlanState(leftMinor);
  const over = state === "over";
  return (
    <View accessibilityLiveRegion="polite">
      <ReceiptSlip padding={RECEIPT_PADDING.screen} tearDepth={8}>
        <View style={styles.head}>
          <NativeText
            accessibilityRole="header"
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={styles.stamp}
          >
            LEFT TO PLAN
          </NativeText>
          {known ? (
            <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.sum}>
              {`${figure(cashMinor, currency)} − ${figure(cashMinor - leftMinor, currency)}`}
            </NativeText>
          ) : null}
        </View>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.figure, over ? styles.figureOver : styles.figureOk]}
        >
          {known ? moneyLabel(leftMinor, currency) : `${currency} …`}
        </NativeText>
        {known ? (
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={[styles.message, MESSAGE_TONE[state]]}
          >
            {leftToPlanMessage(leftMinor, currency)}
          </NativeText>
        ) : null}
        <View style={styles.rule}>
          <DashedRule />
        </View>
        <View style={styles.links}>
          <SlipLink
            emoji="✨"
            label="Use suggestions"
            tone="accent"
            accessibilityHint="Fills each envelope with its usual or last month's amount"
            onPress={onSuggest}
          />
          <SlipLink label="Clear all" tone="quiet" onPress={onClear} />
        </View>
      </ReceiptSlip>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between" },
  stamp: {
    color: colors.paper.textTertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  sum: { color: colors.paper.textTertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
  figure: {
    alignSelf: "flex-start",
    fontFamily: fonts.monoSemibold,
    fontSize: 26,
    lineHeight: 32,
    paddingHorizontal: 4,
  },
  figureOk: { backgroundColor: colors.highlight, color: colors.text.onPaper },
  figureOver: { backgroundColor: colors.paper.warningMarker, color: colors.paper.warning },
  message: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  some: { color: colors.paper.textSecondary },
  zero: { color: colors.paper.positive },
  over: { color: colors.paper.warning },
  rule: { marginTop: 2 },
  links: { flexDirection: "row", gap: space[4] },
});

const MESSAGE_TONE = { some: styles.some, zero: styles.zero, over: styles.over } as const;
