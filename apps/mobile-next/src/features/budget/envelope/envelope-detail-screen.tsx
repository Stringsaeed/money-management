import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useBudgetQuery } from "@/data/ledger-queries";
import { envelopeLines } from "@/features/budget/home/home-model";
import { spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

const GROUP_LABEL = { bills: "Bills", everyday: "Everyday", saving: "Saving for" } as const;

/** Minimal envelope detail: its name and this period's numbers. M4 builds on this route. */
export function EnvelopeDetailScreen({ id }: { readonly id: string }) {
  const budget = useBudgetQuery();
  const line = budget.data?.budget
    ? envelopeLines(budget.data).find((item) => item.envelope.id === id)
    : null;

  if (budget.isError && !line) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState
          title="Couldn't calculate"
          message="Check your connection and try again."
          onRetry={() => void budget.retry()}
        />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen edges={["bottom"]}>
        <Text variant="caption" style={styles.status}>
          Loading envelope…
        </Text>
      </Screen>
    );
  }
  if (!line) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState title="Envelope not found" message="It may have been archived." />
      </Screen>
    );
  }

  const { envelope, totals } = line;
  const rows = [
    ["Planned", totals.plannedMinor],
    ["Rolled over", totals.rolloverMinor],
    ["Spent", totals.spentMinor],
    ["Left", totals.leftMinor],
  ] as const;
  return (
    <Screen edges={["bottom"]} style={styles.screen}>
      <View style={styles.heading}>
        <Text variant="headline">{envelope.name}</Text>
        <Text variant="caption">{GROUP_LABEL[envelope.group]}</Text>
      </View>
      <Surface>
        {rows.map(([label, minor]) => (
          <View key={label} style={styles.row}>
            <Text variant="body">{label}</Text>
            <Text variant="body">{formatMoneyMinor(minor, BUDGET_CURRENCY)}</Text>
          </View>
        ))}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing[4], padding: spacing[5] },
  heading: { gap: spacing[1] },
  row: { flexDirection: "row", justifyContent: "space-between" },
  status: { padding: spacing[5] },
});
