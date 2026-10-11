import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useBudgetPeriodsQuery } from "@/data/ledger-queries";
import { colors, spacing } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { historyStarts, periodLabel } from "./envelope-model";
import { PanelHeader } from "./panel-header";

interface HistoryPanelProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onBack: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

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
      {history.isLoading ? (
        <Text variant="caption">Loading earlier periods…</Text>
      ) : rows.length === 0 ? (
        <Text variant="caption">No earlier periods yet. They appear after your first payday.</Text>
      ) : (
        rows.map(({ period, totals }) => (
          <Surface key={period.start} variant="recessed">
            <Text variant="label">{periodLabel(period)}</Text>
            <View style={styles.row}>
              <Text variant="caption">Planned</Text>
              <Text variant="body">{money(totals.plannedMinor)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="caption">Spent</Text>
              <Text variant="body">{money(totals.spentMinor)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="caption">{totals.leftMinor < 0 ? "Over by" : "Left"}</Text>
              <Text variant="body" style={totals.leftMinor < 0 && styles.over}>
                {money(Math.abs(totals.leftMinor))}
              </Text>
            </View>
          </Surface>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  row: { flexDirection: "row", justifyContent: "space-between" },
  over: { color: colors.terracotta },
});
