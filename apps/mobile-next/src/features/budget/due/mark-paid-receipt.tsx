import { StyleSheet, Text as NativeText } from "react-native";

import {
  colors,
  DashedRule,
  DENSE_MAX_FONT_SCALE,
  fonts,
  LeaderLine,
  MINUS,
  RECEIPT_PADDING,
  ReceiptSlip,
  ReceiptTotal,
} from "@/ui/trove";

import { markPaidNote } from "./due-copy";
import { dueFigure } from "./due-display";

interface MarkPaidReceiptProps {
  readonly envelope: string;
  /** What the envelope has left now. */
  readonly leftMinor: number;
  /** What this payment takes. */
  readonly payingMinor: number;
  readonly currency: string;
  readonly money: (minor: number) => string;
}

const signed = (minor: number, currency: string) =>
  `${minor < 0 ? MINUS : ""}${dueFigure(minor, currency, currency)}`;

/** The envelope this bill comes out of, what paying takes, and what is left after. */
export function MarkPaidReceipt({
  envelope,
  leftMinor,
  payingMinor,
  currency,
  money,
}: MarkPaidReceiptProps) {
  const after = leftMinor - payingMinor;
  return (
    <ReceiptSlip padding={RECEIPT_PADDING.screen} tearDepth={8}>
      <LeaderLine label={`${envelope} left`.toUpperCase()} value={signed(leftMinor, currency)} />
      <LeaderLine label="PAYING" value={signed(-payingMinor, currency)} />
      <DashedRule />
      <ReceiptTotal
        label="LEFT AFTER"
        tone={after >= 0 ? "ok" : "neg"}
        value={after >= 0 ? `${signed(after, currency)} ✓` : signed(after, currency)}
      />
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.note}>
        {markPaidNote(envelope, after, money)}
      </NativeText>
    </ReceiptSlip>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.paper.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
