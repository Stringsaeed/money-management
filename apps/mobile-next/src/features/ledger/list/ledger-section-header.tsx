import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

import type { LedgerSectionHeader as Header } from "./ledger-grouping";
import { formatNet } from "./ledger-row-display";

interface LedgerSectionHeaderProps {
  readonly header: Header;
}

/** Sticky date header carrying the net of the entries beneath it. */
export function LedgerSectionHeader({ header }: LedgerSectionHeaderProps) {
  const net =
    header.net && header.net.minor !== 0 ? formatNet(header.net.minor, header.net.currency) : null;
  return (
    <View style={styles.header}>
      <Text numberOfLines={1} style={styles.dayTitle}>
        {header.title}
      </Text>
      {net ? (
        <Text style={[styles.net, header.net && header.net.minor > 0 && styles.positive]}>
          {net}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
    paddingBottom: spacing[1.5],
    paddingTop: spacing[5],
  },
  dayTitle: {
    color: colors.mutedForeground,
    flexShrink: 1,
    fontFamily: typography.fontBodyBold,
    fontSize: typography.textXs,
    letterSpacing: typography.trackingWide,
    textTransform: "uppercase",
  },
  net: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    fontVariant: ["tabular-nums"],
  },
  positive: { color: colors.sage },
});
