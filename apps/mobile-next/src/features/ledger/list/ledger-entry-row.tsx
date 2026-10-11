import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import {
  amountAccessibilityLabel,
  CategoryTile,
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  layout,
  PressableScale,
  space,
  Text,
} from "@/ui/trove";

import { plainAmount } from "./ledger-money";
import type { LedgerRowDisplay } from "./ledger-row-display";

interface LedgerEntryRowProps {
  readonly transaction: V2Transaction;
  readonly display: LedgerRowDisplay;
  /** Closes its day: the gap before the next day's stamp hangs below the rule. */
  readonly lastInSection: boolean;
  readonly onPress?: (transaction: V2Transaction) => void;
}

/** Board rows are 62pt tall over a 1pt rule. */
const ROW_HEIGHT = 62;
/** Space between one day's last row and the next day's stamp. */
const DAY_GAP = space[2];

/** Ledger day-list row: round emoji tile, title over the mono stamp, and the signed figure. */
export function LedgerEntryRow({
  transaction,
  display,
  lastInSection,
  onPress,
}: LedgerEntryRowProps) {
  const money = display.tone === "income";
  const spokenAmount = `${money ? "plus " : ""}${amountAccessibilityLabel(
    display.signedMinor,
    display.currency,
  )}`;
  return (
    <View style={[styles.gutter, lastInSection ? styles.closesDay : null]}>
      <PressableScale
        accessibilityLabel={[display.title, display.stamp.toLowerCase(), spokenAmount].join(", ")}
        accessibilityRole="button"
        onPress={() => onPress?.(transaction)}
        pressedStyle={styles.pressed}
        scaleOnPress={false}
        style={styles.row}
      >
        {display.kind ? (
          <CategoryTile kind={display.kind} />
        ) : (
          <CategoryTile icon={display.tile} round />
        )}
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
            {display.title}
          </Text>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={styles.stamp}
          >
            {display.stamp}
          </NativeText>
        </View>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.amount, money ? styles.amountIn : null]}
        >
          {plainAmount(display.signedMinor, display.currency, display.signDisplay)}
        </NativeText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  // Items span the list's full width so sticky day stamps can; the gutter lives here.
  gutter: { paddingHorizontal: layout.screenGutter },
  closesDay: { paddingBottom: DAY_GAP },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
    minHeight: ROW_HEIGHT,
  },
  pressed: { opacity: 0.7 },
  copy: { flex: 1, minWidth: 0 },
  stamp: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 16 },
  amount: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  amountIn: { color: colors.positive.text },
});
