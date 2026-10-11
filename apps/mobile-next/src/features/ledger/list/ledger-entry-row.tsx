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
} from "@/ui/trove";

import { plainAmount } from "./ledger-money";
import type { LedgerRowDisplay } from "./ledger-row-display";
import { LedgerRowTitle } from "./ledger-row-title";

/** `day`: the Ledger's day list. `search`: month-grouped search results, a touch tighter. */
export type LedgerEntryLayout = "day" | "search";

interface LedgerEntryRowProps {
  readonly transaction: V2Transaction;
  readonly display: LedgerRowDisplay;
  /** Closes its section: the gap before the next section's stamp hangs below the rule. */
  readonly lastInSection: boolean;
  readonly layout?: LedgerEntryLayout;
  /** Search text to mark in the title. */
  readonly highlight?: string;
  readonly onPress?: (transaction: V2Transaction) => void;
}

/** Ledger day-list row: round emoji tile, title over the mono stamp, and the signed figure. */
export function LedgerEntryRow({
  transaction,
  display,
  lastInSection,
  layout: rowLayout = "day",
  highlight,
  onPress,
}: LedgerEntryRowProps) {
  const money = display.tone === "income";
  const spokenAmount = `${money ? "plus " : ""}${amountAccessibilityLabel(
    display.signedMinor,
    display.currency,
  )}`;
  return (
    <View style={[styles.gutter, lastInSection ? closes[rowLayout] : null]}>
      <PressableScale
        accessibilityLabel={[display.title, display.stamp.toLowerCase(), spokenAmount].join(", ")}
        accessibilityRole="button"
        onPress={() => onPress?.(transaction)}
        pressedStyle={styles.pressed}
        scaleOnPress={false}
        style={[styles.row, heights[rowLayout]]}
      >
        {display.kind ? (
          <CategoryTile kind={display.kind} />
        ) : (
          <CategoryTile icon={display.tile} round />
        )}
        <View style={styles.copy}>
          <LedgerRowTitle highlight={highlight} title={display.title} />
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
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
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

/** Board rows: 62pt in the day list, 60pt in search results, each over a 1pt rule. */
const heights = StyleSheet.create({
  day: { minHeight: 62 },
  search: { minHeight: 60 },
});

/** The gap under a section's last row: 8pt between days, 14pt between search months. */
const closes = StyleSheet.create({
  day: { paddingBottom: space[2] },
  search: { paddingBottom: 14 },
});
