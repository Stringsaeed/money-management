import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Amount, colors, layout, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

interface LeftToPlanBarProps {
  /** The engine's Not planned yet for this draft; `null` while it cannot be calculated. */
  readonly leftMinor: number | null;
}

/** The sticky Left to plan summary: neutral above zero, a line at zero, red below zero. */
export function LeftToPlanBar({ leftMinor }: LeftToPlanBarProps) {
  const over = leftMinor !== null && leftMinor < 0;
  return (
    <View style={styles.bar} accessibilityRole="summary" accessibilityLiveRegion="polite">
      <Text tone="secondary" variant="labelSm">
        Left to plan
      </Text>
      {leftMinor === null ? (
        <Text variant="amountLg">…</Text>
      ) : (
        <Amount
          currency={BUDGET_CURRENCY}
          minor={leftMinor}
          size="lg"
          tone={over ? "negative" : "primary"}
        />
      )}
      {leftMinor === null ? null : (
        <Text tone={over ? "negative" : "secondary"} variant="bodySm">
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
    backgroundColor: colors.bg.subtle,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: space[0.5],
    paddingHorizontal: layout.screenGutter,
    paddingVertical: space[3],
  },
});
