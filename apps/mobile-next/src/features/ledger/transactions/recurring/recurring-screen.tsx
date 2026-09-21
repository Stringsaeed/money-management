import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import {
  useAccountsQuery,
  useCategoriesQuery,
  useLedgerMutations,
  useRecurringQuery,
} from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Sheet } from "@/ui/sheet";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

import { RecurringForm } from "./recurring-form";

export interface RecurringScreenProps {
  readonly onOpenRule?: (id: string) => void;
}

export function RecurringScreen({ onOpenRule }: RecurringScreenProps) {
  const recurring = useRecurringQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutations();
  const [filter, setFilter] = useState<"current" | "needs_attention" | "archived">("current");
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
  if (recurring.isError)
    return (
      <Screen>
        <EmptyState
          title="Recurring Rules unavailable"
          message="Check your connection and try again."
          onRetry={() => void recurring.retry()}
        />
      </Screen>
    );
  return (
    <Screen>
      <LegendList
        data={visible}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headline">Recurring Rules</Text>
            <Button
              title="Add Rule"
              onPress={() => {
                setError(undefined);
                setCreateOpen(true);
              }}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.chips}>
              {(["current", "needs_attention", "archived"] as const).map((item) => (
                <Chip
                  key={item}
                  label={item.replace("_", " ")}
                  selected={filter === item}
                  onPress={() => setFilter(item)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Rules"
            message="Schedule regular income, expenses, and transfers."
            onRetry={() => setCreateOpen(true)}
          />
        }
        renderItem={({ item }) => (
          <Surface variant="raised" style={styles.card}>
            <Button title={item.name} variant="ghost" onPress={() => onOpenRule?.(item.id)} />
            <Text style={styles.meta}>
              {item.frequency} · every {item.intervalCount} · {item.lifecycle}
              {item.health === "needs_attention" ? " · Needs attention" : ""}
            </Text>
            <Text style={styles.amount}>{formatMoneyMinor(item.amountMinor, item.currency)}</Text>
          </Surface>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Sheet open={createOpen} onDismiss={() => setCreateOpen(false)} snapPoints={["half", "full"]}>
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
    gap: spacing[2],
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[3], paddingBottom: spacing[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  card: { gap: spacing[1], padding: spacing[4] },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
  },
  amount: {
    color: colors.ink,
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
  },
  error: { color: colors.destructive },
  separator: { height: spacing[2] },
});
