/* oxlint-disable complexity -- lifecycle actions and the shared Rule editor form one bounded screen workflow. */

import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  useAccountsQuery,
  useCategoriesQuery,
  useLedgerMutations,
  useRecurringQuery,
} from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";

import { RecurringForm } from "./recurring-form";

export interface RecurringRuleScreenProps {
  readonly id?: string;
  readonly onBack?: () => void;
}

export function RecurringRuleScreen({ id = "new", onBack }: RecurringRuleScreenProps) {
  const recurring = useRecurringQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutations();
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const rule = id === "new" ? undefined : recurring.data.find((item) => item.id === id);
  if (id !== "new" && !rule && !recurring.isLoading)
    return (
      <Screen>
        <EmptyState
          title="Rule not found"
          message="This Rule may have been archived or removed."
          onRetry={() => void recurring.retry()}
        />
      </Screen>
    );
  const lifecycleAction = async (lifecycle: "active" | "paused" | "archived") => {
    if (!rule) return;
    setActionError(undefined);
    setBusy(true);
    try {
      await mutations.changeRecurringLifecycle(rule.id, rule.lifecycle, lifecycle);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not update recurring transaction.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.actions}>
          {onBack ? <Button title="Back" variant="ghost" onPress={onBack} /> : null}
          {rule && rule.lifecycle !== "completed" ? (
            <Button
              title={rule.lifecycle === "paused" ? "Resume" : "Pause"}
              variant="secondary"
              disabled={busy}
              onPress={() =>
                void lifecycleAction(rule.lifecycle === "paused" ? "active" : "paused")
              }
            />
          ) : null}
          {rule ? (
            <Button
              title={rule.lifecycle === "archived" ? "Restore" : "Archive"}
              variant="ghost"
              disabled={busy}
              onPress={() =>
                void lifecycleAction(rule.lifecycle === "archived" ? "active" : "archived")
              }
            />
          ) : null}
        </View>
        {actionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {actionError}
          </Text>
        ) : null}
        <RecurringForm
          rule={rule}
          accounts={accounts.data}
          categories={categories.data}
          busy={busy}
          error={error}
          onCancel={onBack}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              if (rule) await mutations.updateRecurring(rule.id, input, rule.revision);
              else await mutations.createRecurring(input);
              onBack?.();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not save Rule.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  scrollContent: { gap: spacing[3], paddingBottom: spacing[16] },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  error: { color: colors.destructive },
});
