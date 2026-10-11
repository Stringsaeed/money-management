import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, spacing } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
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
        <Text variant="label">Left</Text>
        <Text variant="amount" style={totals.leftMinor < 0 && styles.negative}>
          {money(totals.leftMinor)}
        </Text>
        <Text variant="caption">{`of ${money(totals.plannedMinor)} planned · ${days}`}</Text>
        {pace > 0 ? <Text variant="caption">{`about ${money(pace)} a day`}</Text> : null}
      </View>
      <Surface>
        {rows.map(([label, minor]) => (
          <View key={label} style={styles.row}>
            <Text variant="body">{label}</Text>
            <Text variant="body">{money(minor)}</Text>
          </View>
        ))}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4] },
  hero: { gap: spacing[1] },
  negative: { color: colors.terracotta },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
