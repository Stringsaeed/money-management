import { StyleSheet, Text as NativeText, View } from "react-native";

import { amountAccessibilityLabel, colors, DENSE_MAX_FONT_SCALE, fonts, layout } from "@/ui/trove";

import type { LedgerSectionHeader as Header } from "./ledger-grouping";
import { plainAmount } from "./ledger-money";

interface LedgerSectionHeaderProps {
  readonly header: Header;
}

const LEADER = "·".repeat(64);

/** Sticky day stamp: `TODAY ········ −82.20`, carrying the net of the entries beneath it. */
export function LedgerSectionHeader({ header }: LedgerSectionHeaderProps) {
  const net = header.net && header.net.minor !== 0 ? header.net : null;
  const spokenNet = net
    ? `, net ${net.minor > 0 ? "plus " : ""}${amountAccessibilityLabel(net.minor, net.currency)}`
    : "";
  return (
    <View
      accessibilityLabel={`${header.title.toLowerCase()}${spokenNet}`}
      accessibilityRole="header"
      accessible
      style={styles.header}
    >
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.stamp}>
        {header.title}
      </NativeText>
      <NativeText
        ellipsizeMode="clip"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.stamp, styles.leader]}
      >
        {LEADER}
      </NativeText>
      {net ? (
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.stamp}>
          {plainAmount(net.minor, net.currency, "always")}
        </NativeText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Opaque so rows scroll cleanly beneath the sticky stamp.
  header: {
    alignItems: "baseline",
    backgroundColor: colors.bg.canvas,
    flexDirection: "row",
    gap: 6,
    paddingBottom: 4,
    paddingHorizontal: layout.screenGutter,
    paddingTop: 10,
  },
  stamp: {
    color: colors.text.tertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
  },
  leader: { flex: 1, opacity: 0.6 },
});
