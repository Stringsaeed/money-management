import { StyleSheet, View } from "react-native";

import type { V2TransactionKind } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";
import { spacing } from "@/ui/design-tokens";

import { FilterSection } from "./filter-section";
import { DATE_PRESETS, KIND_LABELS, presetRange, toggleValue } from "./ledger-filters";
import { LedgerSearchField } from "./ledger-search-field";
import type { LedgerListModel } from "./use-ledger-list";

interface LedgerFilterSheetProps {
  readonly list: LedgerListModel;
}

const KINDS: readonly V2TransactionKind[] = ["expense", "income", "transfer"];

/** Every filter in one place. Changes apply live; the list behind updates as you tap. */
export function LedgerFilterSheet({ list }: LedgerFilterSheetProps) {
  const { filters, update } = list;
  const count = list.summary.data?.count;
  const expense = list.categories.filter((category) => category.kind === "expense");
  const income = list.categories.filter((category) => category.kind === "income");
  const categoryOption = (category: (typeof list.categories)[number]) => ({
    id: category.id,
    label: category.icon ? `${category.icon} ${category.name}` : category.name,
  });
  const toggleCategory = (id: string) =>
    update((current) => ({ ...current, categoryIds: toggleValue(current.categoryIds, id) }));

  return (
    <Sheet open={list.filtersOpen} onDismiss={list.closeFilters} snapPoints={["full"]}>
      <View style={styles.header}>
        <Text variant="headline">Filter ledger</Text>
        <Text variant="caption">Choose within a group to widen, across groups to narrow.</Text>
      </View>
      <LedgerSearchField
        value={filters.search}
        onSubmit={(search) => update((current) => ({ ...current, search }))}
      />
      <FilterSection
        title="Type"
        options={KINDS.map((kind) => ({ id: kind, label: KIND_LABELS[kind] }))}
        isSelected={(id) => filters.kinds.includes(id)}
        onToggle={(id) =>
          update((current) => ({
            ...current,
            kinds: toggleValue(current.kinds, id),
          }))
        }
      />
      <FilterSection
        title="Date"
        options={DATE_PRESETS.map(({ preset, label }) => ({ id: preset, label }))}
        isSelected={(id) => filters.range?.preset === id}
        onToggle={(id) =>
          update((current) => ({
            ...current,
            range: current.range?.preset === id ? null : presetRange(id, new Date()),
          }))
        }
      />
      <FilterSection
        title="Accounts"
        options={list.accounts.map((account) => ({ id: account.id, label: account.name }))}
        isSelected={(id) => filters.accountIds.includes(id)}
        onToggle={(id) =>
          update((current) => ({ ...current, accountIds: toggleValue(current.accountIds, id) }))
        }
      />
      <FilterSection
        title="Spending categories"
        options={expense.map(categoryOption)}
        isSelected={(id) => filters.categoryIds.includes(id)}
        onToggle={toggleCategory}
      />
      <FilterSection
        title="Income categories"
        options={income.map(categoryOption)}
        isSelected={(id) => filters.categoryIds.includes(id)}
        onToggle={toggleCategory}
      />
      <View style={styles.footer}>
        <Button title="Reset" variant="ghost" onPress={list.clear} />
        <Button
          title={count === undefined ? "Show results" : `Show ${count.toLocaleString()} entries`}
          onPress={list.closeFilters}
          style={styles.primary}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[1], marginBottom: spacing[1] },
  footer: { flexDirection: "row", gap: spacing[2], marginTop: spacing[3] },
  primary: { flex: 1 },
});
