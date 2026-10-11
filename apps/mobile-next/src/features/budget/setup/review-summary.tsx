import { format, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { PlanPreview } from "./setup-plan";
import { GROUP_LABELS, GROUP_ORDER } from "./setup-types";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

interface ReviewSummaryProps {
  readonly preview: PlanPreview;
  readonly periodStart: string;
}

/** Safe to spend and per day, group totals, and Not planned yet: the numbers the budget starts with. */
export function ReviewSummary({ preview, periodStart }: ReviewSummaryProps) {
  const since = format(parseISO(periodStart), "d MMM");
  return (
    <>
      <View style={styles.hero}>
        <Text variant="label">Safe to spend</Text>
        <Text variant="amount">{money(preview.safeToSpendMinor)}</Text>
        <Text variant="caption">
          {`${money(preview.perDayMinor)} a day for ${preview.daysLeft} ${preview.daysLeft === 1 ? "day" : "days"}`}
        </Text>
      </View>
      <View style={styles.rows}>
        {GROUP_ORDER.map((group) => (
          <View key={group} style={styles.row}>
            <Text>{GROUP_LABELS[group]}</Text>
            <Text>{money(preview.groupTotals[group])}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text>Not planned yet</Text>
          <Text>{money(preview.leftToPlanMinor)}</Text>
        </View>
      </View>
      <Text variant="caption">{`Spending you already logged since ${since} is counted once.`}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing[1] },
  rows: { gap: spacing[3] },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
