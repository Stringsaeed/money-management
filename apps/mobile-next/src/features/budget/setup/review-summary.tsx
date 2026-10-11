import { format, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { Amount, ListGroup, ListRow, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { noSafeToSpendReason } from "../home/home-model";
import type { PlanPreview } from "./setup-plan";
import { GROUP_LABELS, GROUP_ORDER } from "./setup-types";

interface ReviewSummaryProps {
  readonly currency: string;
  readonly preview: PlanPreview;
  readonly periodStart: string;
}

/** Safe to spend and per day, group totals, and Not planned yet: the numbers the budget starts with. */
export function ReviewSummary({ currency, preview, periodStart }: ReviewSummaryProps) {
  const money = (minor: number) => formatMoneyMinor(minor, currency);
  const since = format(parseISO(periodStart), "d MMM");
  const reason = noSafeToSpendReason(preview.safeToSpendMinor);
  return (
    <>
      <View style={styles.hero}>
        <Text tone="secondary" variant="labelSm">
          Safe to spend
        </Text>
        <Amount currency={currency} minor={preview.safeToSpendMinor} size="hero" />
        <Text tone="secondary" variant="bodySm">
          {`${money(preview.perDayMinor)} a day for ${preview.daysLeft} ${preview.daysLeft === 1 ? "day" : "days"}`}
        </Text>
        {reason ? (
          <Text tone="secondary" variant="bodySm">
            {reason}
          </Text>
        ) : null}
      </View>
      <ListGroup dividerInset={0}>
        {GROUP_ORDER.map((group) => (
          <ListRow
            key={group}
            title={GROUP_LABELS[group]}
            trailing={<Amount currency={currency} minor={preview.groupTotals[group]} />}
          />
        ))}
        <ListRow
          title="Not planned yet"
          trailing={<Amount currency={currency} minor={preview.leftToPlanMinor} />}
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
