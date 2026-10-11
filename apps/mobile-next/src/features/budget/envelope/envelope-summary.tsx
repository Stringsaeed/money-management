import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Amount, ListGroup, ListRow, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { EnvelopeLine } from "../home/home-model";

import { paceMinor } from "./envelope-model";

interface EnvelopeSummaryProps {
  readonly line: EnvelopeLine;
  readonly daysLeft: number;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** M4 top: Left, the plan it came from, the daily pace, and the three numbers behind it. */
export function EnvelopeSummary({ line, daysLeft }: EnvelopeSummaryProps) {
  const { totals } = line;
  const pace = paceMinor(totals.leftMinor, daysLeft);
  const days = `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go`;
  const rows = [
    ["Planned", totals.plannedMinor],
    ["Spent", totals.spentMinor],
    ["From last month", totals.rolloverMinor],
  ] as const;
  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={`${line.envelope.name}, ${money(totals.leftMinor)} left of ${money(totals.plannedMinor)} planned, ${days}`}
        style={styles.hero}
      >
        <Text tone="secondary" variant="labelSm">
          Left
        </Text>
        <Amount
          currency={BUDGET_CURRENCY}
          minor={totals.leftMinor}
          size="hero"
          tone={totals.leftMinor < 0 ? "negative" : "primary"}
        />
        <Text tone="secondary" variant="bodySm">
          {`of ${money(totals.plannedMinor)} planned · ${days}`}
        </Text>
        {pace > 0 ? (
          <Text tone="secondary" variant="bodySm">
            {`about ${money(pace)} a day`}
          </Text>
        ) : null}
      </View>
      <ListGroup dividerInset={0}>
        {rows.map(([label, minor]) => (
          <ListRow
            key={label}
            title={label}
            trailing={<Amount currency={BUDGET_CURRENCY} minor={minor} />}
          />
        ))}
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[4] },
  hero: { gap: space[1] },
});
