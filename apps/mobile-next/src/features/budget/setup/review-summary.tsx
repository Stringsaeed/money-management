import { format, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Amount, ListGroup, ListRow, space, Text } from "@/ui/trove";
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
        <Text tone="secondary" variant="labelSm">
          Safe to spend
        </Text>
        <Amount currency={BUDGET_CURRENCY} minor={preview.safeToSpendMinor} size="hero" />
        <Text tone="secondary" variant="bodySm">
          {`${money(preview.perDayMinor)} a day for ${preview.daysLeft} ${preview.daysLeft === 1 ? "day" : "days"}`}
        </Text>
      </View>
      <ListGroup dividerInset={0}>
        {GROUP_ORDER.map((group) => (
          <ListRow
            key={group}
            title={GROUP_LABELS[group]}
            trailing={<Amount currency={BUDGET_CURRENCY} minor={preview.groupTotals[group]} />}
          />
        ))}
        <ListRow
          title="Not planned yet"
          trailing={<Amount currency={BUDGET_CURRENCY} minor={preview.leftToPlanMinor} />}
        />
      </ListGroup>
      <Text tone="secondary" variant="bodySm">
        {`Spending you already logged since ${since} is counted once.`}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space[1] },
});
