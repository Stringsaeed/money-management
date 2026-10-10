import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useAccountsQuery, useCategoriesQuery, useRecurringQuery } from "@/data/ledger-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import {
  Amount,
  Banner,
  EmptyState,
  Header,
  layout,
  ListGroup,
  ListRow,
  Screen,
  SegmentedControl,
  Sheet,
  space,
  type SegmentOption,
} from "@/ui/trove";

import { RECURRING_KIND_ICONS, recurringAmount, recurringSubtitle } from "./recurring-display";
import { RecurringForm } from "./recurring-form";

export interface RecurringScreenProps {
  readonly onOpenRule?: (id: string) => void;
  readonly onBack?: () => void;
}

type RecurringFilter = "current" | "needs_attention" | "archived";

const FILTER_OPTIONS = [
  { value: "current", label: "Current" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "archived", label: "Archived" },
] as const satisfies readonly SegmentOption<RecurringFilter>[];

export function RecurringScreen({ onOpenRule, onBack }: RecurringScreenProps) {
  const recurring = useRecurringQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutationsWithSound();
  const [filter, setFilter] = useState<RecurringFilter>("current");
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const visible = recurring.data.filter((rule) =>
    filter === "archived"
      ? rule.lifecycle === "archived"
      : filter === "needs_attention"
        ? rule.health === "needs_attention"
        : rule.lifecycle !== "archived",
  );
  const openCreate = () => {
    setError(undefined);
    setCreateOpen(true);
  };
  const headerActions = [{ icon: "add", label: "Add rule", onPress: openCreate } as const];
  const header = (
    <View style={styles.top}>
      <Header variant="compact" title="Recurring" onBack={onBack} actions={headerActions} />
    </View>
  );
  if (recurring.isError)
    return (
      <Screen>
        {header}
        <EmptyState
          title="Recurring Rules unavailable"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void recurring.retry()}
        />
      </Screen>
    );
  return (
    <Screen>
      {header}
      <LegendList
        data={visible}
        keyExtractor={(item) => item.id}
        estimatedItemSize={72}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            {error ? <Banner tone="negative" message={error} /> : null}
            <SegmentedControl
              accessibilityLabel="Filter rules"
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="recurring"
            title="No Rules"
            message="Schedule regular income, expenses, and transfers."
            actionLabel="Add rule"
            onAction={openCreate}
          />
        }
        renderItem={({ item }) => {
          const amount = recurringAmount(item);
          return (
            <ListGroup>
              <ListRow
                title={item.name}
                subtitle={recurringSubtitle(item)}
                icon={RECURRING_KIND_ICONS[item.kind]}
                trailing={
                  <Amount
                    minor={amount.minor}
                    currency={item.currency}
                    signDisplay={amount.signDisplay}
                    size="sm"
                  />
                }
                chevron
                onPress={() => onOpenRule?.(item.id)}
              />
            </ListGroup>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Sheet
        open={createOpen}
        onDismiss={() => setCreateOpen(false)}
        title="Add recurring rule"
        snapPoints={["half", "full"]}
      >
        <RecurringForm
          accounts={accounts.data}
          categories={categories.data}
          busy={busy}
          error={error}
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              await mutations.createRecurring(input);
              setCreateOpen(false);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not create Rule.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space[16],
    paddingHorizontal: layout.screenGutter,
  },
  top: { paddingHorizontal: layout.screenGutter },
  header: { gap: space[3], paddingBottom: space[4] },
  separator: { height: space[2] },
});
