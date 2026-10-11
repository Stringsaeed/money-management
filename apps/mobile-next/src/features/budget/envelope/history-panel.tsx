import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useBudgetPeriodsQuery } from "@/data/ledger-queries";
import { Amount, Button, ListGroup, ListRow, space, Text } from "@/ui/trove";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { historyStarts, periodLabel } from "./envelope-model";
import { PanelHeader } from "./panel-header";

interface HistoryPanelProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onBack: () => void;
}

/** Planned, spent, and left in this envelope for each earlier period. */
export function HistoryPanel({ view, line, onBack }: HistoryPanelProps) {
  const starts = historyStarts(
    view.paydayRule,
    view.current.period.start,
    view.budget.activationPeriodStart,
  );
  const history = useBudgetPeriodsQuery(starts);
  const rows = history.periods.flatMap((period) => {
    const totals = period?.envelopes.find((item) => item.id === line.envelope.id);
    return period && totals ? [{ period: period.period, totals }] : [];
  });

  return (
    <View style={styles.container}>
      <PanelHeader title="History" onBack={onBack} />
      {history.isError ? (
        <View accessibilityRole="alert" style={styles.container}>
          <Text tone="negative" variant="bodySm">
            {rows.length === 0
              ? "Couldn't load earlier periods."
              : "Couldn't load some earlier periods, so this list is incomplete."}
          </Text>
          <Button
            fullWidth
            label="Retry"
            variant="secondary"
            onPress={() => void history.retry()}
          />
        </View>
      ) : null}
      {history.isLoading ? (
        <Text tone="secondary" variant="bodySm">
          Loading earlier periods…
        </Text>
      ) : rows.length === 0 && !history.isError ? (
        <Text tone="secondary" variant="bodySm">
          No earlier periods yet. They appear after your first payday.
        </Text>
      ) : (
        rows.map(({ period, totals }) => (
          <ListGroup key={period.start} dividerInset={0} header={periodLabel(period)}>
            <ListRow
              title="Planned"
              trailing={<Amount currency={BUDGET_CURRENCY} minor={totals.plannedMinor} />}
            />
            <ListRow
              title="Spent"
              trailing={<Amount currency={BUDGET_CURRENCY} minor={totals.spentMinor} />}
            />
            <ListRow
              title={totals.leftMinor < 0 ? "Over by" : "Left"}
              trailing={
                <Amount
                  currency={BUDGET_CURRENCY}
                  minor={Math.abs(totals.leftMinor)}
                  tone={totals.leftMinor < 0 ? "negative" : "primary"}
                />
              }
            />
          </ListGroup>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
});
