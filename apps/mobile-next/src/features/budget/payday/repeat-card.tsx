
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { RepeatPlan } from "./repeat-plan-model";

interface RepeatCardProps {
  readonly plan: RepeatPlan;
  readonly onAdjust: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

export const pluralEnvelopes = (count: number) =>
  `${count} ${count === 1 ? "envelope" : "envelopes"}`;

/** The result line for Repeat last month's plan, or "Short AED X" when the money is not there. */
export function RepeatCard({ plan, onAdjust }: RepeatCardProps) {
  return (
    <View style={styles.card}>
      <Text variant="body">Repeat last month&apos;s plan</Text>
      {plan.items.length === 0 ? (
        <Text variant="caption">This month already matches last month&apos;s plan.</Text>
      ) : plan.shortMinor > 0 ? (
        <>
          <Text accessibilityRole="alert" style={styles.short}>
            {`Short ${money(plan.shortMinor)}: lower Everyday or Saving for`}
          </Text>
          <Button title="Adjust" variant="secondary" onPress={onAdjust} />
        </>
      ) : (
        <Text variant="caption">
          {`Plans ${money(plan.totalMinor)} across ${pluralEnvelopes(plan.items.length)}, leaving ${money(plan.availableMinor - plan.totalMinor)} to plan.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[2],
    padding: spacing[4],
  },
  short: { color: colors.terracotta },
});
