import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useBudgetQuery } from "@/data/ledger-queries";
import { envelopeLines } from "@/features/budget/home/home-model";
import {
  Amount,
  EmptyState,
  Header,
  layout,
  ListGroup,
  ListRow,
  Screen,
  space,
  Text,
} from "@/ui/trove";

const GROUP_LABEL = { bills: "Bills", everyday: "Everyday", saving: "Saving for" } as const;

/** Minimal envelope detail: its name and this period's numbers. M4 builds on this route. */
export function EnvelopeDetailScreen({ id }: { readonly id: string }) {
  const budget = useBudgetQuery();
  const line = budget.data?.budget
    ? envelopeLines(budget.data).find((item) => item.envelope.id === id)
    : null;
  const header = <Header variant="compact" title="Envelope" onBack={() => router.back()} />;

  if (budget.isError && !line) {
    return (
      <Screen style={styles.screen}>
        {header}
        <EmptyState
          title="Couldn't calculate"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void budget.retry()}
          framed={false}
        />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen style={styles.screen}>
        {header}
        <Text tone="secondary" variant="bodySm">
          Loading envelope…
        </Text>
      </Screen>
    );
  }
  if (!line) {
    return (
      <Screen style={styles.screen}>
        {header}
        <EmptyState
          title="Envelope not found"
          message="It may have been archived."
          framed={false}
        />
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
    <Screen style={styles.screen}>
      {header}
      <View style={styles.heading}>
        <Text variant="titleLg">{envelope.name}</Text>
        <Text tone="secondary" variant="bodySm">
          {GROUP_LABEL[envelope.group]}
        </Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: space[4], paddingHorizontal: layout.screenGutter },
  heading: { gap: space[1] },
});
