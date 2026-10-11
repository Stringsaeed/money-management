import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, fonts, Icon, PressableScale, radius } from "@/ui/trove";

import { LedgerDashedRule } from "./ledger-dashed-rule";
import { LedgerReceiptTear } from "./ledger-receipt-tear";

interface LedgerEmptyReceiptProps {
  /** `OCTOBER`. */
  readonly month: string;
  /** `AED 0.00`; just `0.00` while the ledger has no account to name a currency. */
  readonly total: string;
  readonly onAddTransaction?: () => void;
}

/** First run: a blank slip for the month, and the button that prints its first line. */
export function LedgerEmptyReceipt({ month, total, onAddTransaction }: LedgerEmptyReceiptProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.slip}>
        <NativeText style={styles.header}>{`${month} · 0 ENTRIES`}</NativeText>
        <LedgerDashedRule color={colors.paper.ruleStrong} />
        <NativeText
          accessibilityElementsHidden
          allowFontScaling={false}
          importantForAccessibility="no"
          style={styles.emoji}
        >
          🧾
        </NativeText>
        <NativeText accessibilityRole="header" style={styles.title}>
          No transactions yet
        </NativeText>
        <NativeText style={styles.body}>
          Log what you spend and it prints here, one day at a time.
        </NativeText>
        <View accessible accessibilityLabel={`Total ${total}`} style={styles.total}>
          <LedgerDashedRule color={colors.paper.ruleStrong} />
          <View style={styles.totalLine}>
            <NativeText style={styles.totalText}>TOTAL</NativeText>
            <NativeText style={styles.totalText}>{total}</NativeText>
          </View>
        </View>
        {onAddTransaction ? (
          <View style={styles.primaryWrap}>
            <PressableScale
              accessibilityRole="button"
              onPress={onAddTransaction}
              pressedStyle={styles.primaryPressed}
              style={styles.primary}
            >
              <Icon color={colors.highlight} name="add" size={20} strokeWidth={2.25} />
              <NativeText style={styles.primaryLabel}>Add transaction</NativeText>
            </PressableScale>
          </View>
        ) : null}
      </View>
      <LedgerReceiptTear />
    </View>
  );
}

const styles = StyleSheet.create({
  // 28pt under the shortcuts, and 18pt in from the screen gutter on each side.
  wrap: { marginHorizontal: 38, marginTop: 28 },
  slip: {
    alignItems: "center",
    backgroundColor: colors.surface.paper,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: colors.paper.shadow }],
    gap: 12,
    paddingBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  header: {
    color: colors.paper.textTertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 16,
  },
  emoji: { fontSize: 48, lineHeight: 56 },
  title: {
    color: colors.text.onPaper,
    fontFamily: fonts.extrabold,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 28,
    textAlign: "center",
  },
  body: {
    color: colors.paper.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  total: { alignSelf: "stretch" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  totalText: {
    color: colors.text.onPaper,
    fontFamily: fonts.monoSemibold,
    fontSize: 14,
    lineHeight: 18,
  },
  // PressableScale animates an inner view, so the stretch lives on a wrapper.
  primaryWrap: { alignSelf: "stretch", marginTop: 4 },
  primary: {
    alignItems: "center",
    backgroundColor: colors.paper.ink,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center",
  },
  primaryPressed: { opacity: 0.85 },
  primaryLabel: {
    color: colors.highlight,
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
  },
});
