import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

interface LeftToPlanBarProps {
  /** The engine's Not planned yet for this draft; `null` while it cannot be calculated. */
  readonly leftMinor: number | null;
}

/** The sticky Left to plan summary: neutral above zero, a line at zero, orange below zero. */
export function LeftToPlanBar({ leftMinor }: LeftToPlanBarProps) {
  const over = leftMinor !== null && leftMinor < 0;
  return (
    <View style={styles.bar} accessibilityRole="summary" accessibilityLiveRegion="polite">
      <Text variant="label">Left to plan</Text>
      <Text variant="headline" style={over && styles.over}>
        {leftMinor === null ? "…" : formatMoneyMinor(leftMinor, BUDGET_CURRENCY)}
      </Text>
      {leftMinor === null ? null : (
        <Text variant="caption" style={over && styles.over}>
          {over
            ? `Planned ${formatMoneyMinor(-leftMinor, BUDGET_CURRENCY)} more than you have. Lower amounts.`
            : leftMinor === 0
              ? "Every dirham has a job."
              : `${formatMoneyMinor(leftMinor, BUDGET_CURRENCY)} not planned yet: it counts as safe to spend.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceContainer,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[0.5],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  over: { color: colors.terracotta },
});
