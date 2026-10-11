import { StyleSheet, View } from "react-native";

import { colors, layout, SectionHeader, space } from "@/ui/trove";

import type { LedgerSectionHeader as Header } from "./ledger-grouping";

interface LedgerSectionHeaderProps {
  readonly header: Header;
}

/** Sticky date header carrying the net of the entries beneath it. */
export function LedgerSectionHeader({ header }: LedgerSectionHeaderProps) {
  const net = header.net && header.net.minor !== 0 ? header.net : null;
  return (
    <View style={styles.header}>
      {net ? (
        <SectionHeader title={header.title} totalMinor={net.minor} currency={net.currency} />
      ) : (
        <SectionHeader title={header.title} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Opaque so rows scroll cleanly beneath the sticky header.
  header: {
    backgroundColor: colors.bg.canvas,
    paddingBottom: space[2],
    paddingHorizontal: layout.cardPadding,
    paddingTop: space[5],
  },
});
