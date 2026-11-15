import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2BudgetPeriod } from "@trove/api/v2/contracts";

import {
  colors,
  DashedRule,
  DENSE_MAX_FONT_SCALE,
  fonts,
  LeaderLine,
  ReceiptNote,
  ReceiptSlip,
  ReceiptTotal,
} from "@/ui/trove";

import {
  everydaySpentLabel,
  figure,
  moneyLabel,
  perDayNote,
  receiptPeriodLine,
} from "./setup-copy";
import type { PlanPreview } from "./setup-plan";
import { GROUP_LABELS, GROUP_ORDER, GROUP_RECEIPT_EMOJI } from "./setup-types";

interface ReviewReceiptProps {
  readonly currency: string;
  readonly preview: PlanPreview;
  readonly period: V2BudgetPeriod;
  /** Ticked envelopes per group, for "BILLS · 4". */
  readonly counts: Readonly<Record<(typeof GROUP_ORDER)[number], number>>;
  readonly household: boolean;
}

/**
 * S5's "Here's your month" receipt: money you have, each group's plan, what is not planned yet,
 * Everyday spending already logged, and Safe to spend with its daily figure.
 */
export function ReviewReceipt({
  currency,
  preview,
  period,
  counts,
  household,
}: ReviewReceiptProps) {
  const spent = preview.everydaySpentMinor;
  return (
    <ReceiptSlip gap={8}>
      <NativeText
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.title}
      >
        {household ? "HOUSEHOLD BUDGET" : "PERSONAL BUDGET"}
      </NativeText>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.period}>
        {receiptPeriodLine(period, preview.daysLeft)}
      </NativeText>
      <DashedRule />
      <LeaderLine
        emoji="🏦"
        label="MONEY YOU HAVE"
        value={figure(preview.cashMinor, currency)}
        weight="bold"
      />
      {GROUP_ORDER.map((group) => (
        <LeaderLine
          key={group}
          emoji={GROUP_RECEIPT_EMOJI[group]}
          label={`${GROUP_LABELS[group].toUpperCase()} · ${counts[group]}`}
          value={figure(preview.groupTotals[group], currency)}
        />
      ))}
      <LeaderLine
        emoji="🫙"
        label="NOT PLANNED YET"
        value={figure(preview.leftToPlanMinor, currency)}
      />
      <DashedRule />
      {spent > 0 ? (
        <>
          <View accessible style={styles.split}>
            <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.splitText}>
              {everydaySpentLabel(period.start)}
            </NativeText>
            <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.splitText}>
              {figure(-spent, currency)}
            </NativeText>
          </View>
          <DashedRule />
        </>
      ) : null}
      <ReceiptTotal
        label="SAFE TO SPEND"
        size="xl"
        tone={preview.safeToSpendMinor < 0 ? "neg" : "ok"}
        value={moneyLabel(preview.safeToSpendMinor, currency)}
      />
      <ReceiptNote text={perDayNote(preview.perDayMinor, currency)} />
    </ReceiptSlip>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text.onPaper,
    fontFamily: fonts.monoSemibold,
    fontSize: 13,
    letterSpacing: 2,
    lineHeight: 18,
    textAlign: "center",
  },
  period: {
    color: colors.paper.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    lineHeight: 18,
    textAlign: "center",
  },
  split: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  splitText: {
    color: colors.paper.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 18,
  },
});
