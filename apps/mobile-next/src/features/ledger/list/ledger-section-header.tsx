import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

import type { LedgerSectionHeader as Header } from "./ledger-grouping";
import { formatNet } from "./ledger-row-display";

interface LedgerSectionHeaderProps {
  readonly header: Header;
  /** `day` is a quiet caption; `month` is a heading with a rule, for statement layouts. */
  readonly tone?: "day" | "month";
}

/** Sticky date header carrying the net of the entries beneath it. */
export function LedgerSectionHeader({ header, tone = "day" }: LedgerSectionHeaderProps) {
  const net =
    header.net && header.net.minor !== 0 ? formatNet(header.net.minor, header.net.currency) : null;
  return (
    <View style={[styles.header, tone === "month" && styles.month]}>
      <Text numberOfLines={1} style={tone === "month" ? styles.monthTitle : styles.dayTitle}>
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
  month: {
    borderBottomColor: colors.foreground,
    borderBottomWidth: 1.5,
    paddingBottom: spacing[2],
    paddingTop: spacing[6],
  },
  dayTitle: {
    color: colors.mutedForeground,
    flexShrink: 1,
    fontFamily: typography.fontBodyBold,
    fontSize: typography.textXs,
    letterSpacing: typography.trackingWide,
    textTransform: "uppercase",
  },
  monthTitle: {
    color: colors.foreground,
    flexShrink: 1,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.textLg,
  },
  net: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    fontVariant: ["tabular-nums"],
  },
  positive: { color: colors.sage },
});
