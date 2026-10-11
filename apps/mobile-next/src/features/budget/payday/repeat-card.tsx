import { StyleSheet } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button, Card, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { RepeatPlan } from "./repeat-plan-model";
import type { LastMonth } from "./use-plan-month";

interface RepeatCardProps {
  readonly plan: RepeatPlan;
  readonly lastMonth: Exclude<LastMonth, "none">;
  readonly onRetry: () => void;
  readonly onAdjust: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

export const pluralEnvelopes = (count: number) =>
  `${count} ${count === 1 ? "envelope" : "envelopes"}`;

/**
 * The result line for Repeat last month's plan, or "Short AED X" when the money is not there.
 * While last month loads or after it fails to load, it says so instead of "already matches".
 */
export function RepeatCard({ plan, lastMonth, onRetry, onAdjust }: RepeatCardProps) {
  return (
    <Card style={styles.card}>
      <Text variant="labelMd">Repeat last month&apos;s plan</Text>
      {lastMonth === "loading" ? (
        <Text tone="secondary" variant="bodySm">
          Loading last month&apos;s plan…
        </Text>
      ) : lastMonth === "error" ? (
        <>
          <Text accessibilityRole="alert" tone="negative" variant="bodySm">
            Couldn&apos;t load last month&apos;s plan, so it can&apos;t be repeated yet.
          </Text>
          <Button fullWidth label="Retry" variant="secondary" onPress={onRetry} />
        </>
      ) : plan.items.length === 0 ? (
        <Text tone="secondary" variant="bodySm">
          This month already matches last month&apos;s plan.
        </Text>
      ) : plan.shortMinor > 0 ? (
        <>
          <Text accessibilityRole="alert" tone="negative">
            {`Short ${money(plan.shortMinor)}: lower Everyday or Saving for`}
          </Text>
          <Button fullWidth label="Adjust" variant="secondary" onPress={onAdjust} />
        </>
      ) : (
        <Text tone="secondary" variant="bodySm">
          {`Plans ${money(plan.totalMinor)} across ${pluralEnvelopes(plan.items.length)}, leaving ${money(plan.availableMinor - plan.totalMinor)} to plan.`}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
});
