import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { GroupSummary } from "./home-model";

interface GroupSummaryRowProps {
  readonly title: string;
  readonly noun: { readonly one: string; readonly many: string };
  /** What "left" means for this group, e.g. "left" for bills or "set aside" for saving. */
  readonly leftLabel: string;
  readonly summary: GroupSummary;
}

/** Bills and Saving-for summary: count and totals only. Not tappable until Bills & big payments. */
export function GroupSummaryRow({ title, noun, leftLabel, summary }: GroupSummaryRowProps) {
  const count = `${summary.count} ${summary.count === 1 ? noun.one : noun.many}`;
  const detail =
    summary.count === 0
      ? "None yet"
      : `${count} · ${formatMoneyMinor(summary.leftMinor, BUDGET_CURRENCY)} ${leftLabel}`;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}, ${detail}`}
      style={styles.row}
    >
      <Text variant="body">{title}</Text>
      <Text variant="caption">{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[0.5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});
