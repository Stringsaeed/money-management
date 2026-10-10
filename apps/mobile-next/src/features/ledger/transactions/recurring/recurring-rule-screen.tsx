/* oxlint-disable complexity -- lifecycle actions and the shared Rule editor form one bounded screen workflow. */

import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAccountsQuery, useCategoriesQuery, useRecurringQuery } from "@/data/ledger-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { Banner, Button, EmptyState, Header, layout, Screen, space } from "@/ui/trove";

import { RecurringForm } from "./recurring-form";

export interface RecurringRuleScreenProps {
  readonly id?: string;
  readonly onBack?: () => void;
}

export function RecurringRuleScreen({ id = "new", onBack }: RecurringRuleScreenProps) {
  const recurring = useRecurringQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutationsWithSound();
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const rule = id === "new" ? undefined : recurring.data.find((item) => item.id === id);
  if (id !== "new" && !rule && !recurring.isLoading)
    return (
      <Screen>
        <View style={styles.top}>
          <Header variant="compact" title="Recurring rule" onBack={onBack} />
        </View>
        <EmptyState
          title="Rule not found"
          message="This Rule may have been archived or removed."
          actionLabel="Try again"
          onAction={() => void recurring.retry()}
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
      <View style={styles.top}>
        <Header variant="compact" title={rule?.name ?? "Recurring rule"} onBack={onBack} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.actions}>
          {rule && rule.lifecycle !== "completed" ? (
            <Button
              label={rule.lifecycle === "paused" ? "Resume" : "Pause"}
              variant="secondary"
              disabled={busy}
              onPress={() =>
                void lifecycleAction(rule.lifecycle === "paused" ? "active" : "paused")
              }
            />
          ) : null}
          {rule ? (
            <Button
              label={rule.lifecycle === "archived" ? "Restore" : "Archive"}
              variant="tertiary"
              disabled={busy}
              onPress={() =>
                void lifecycleAction(rule.lifecycle === "archived" ? "active" : "archived")
              }
            />
          ) : null}
        </View>
        {actionError ? <Banner tone="negative" message={actionError} /> : null}
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
  screen: { paddingHorizontal: layout.screenGutter },
  top: { paddingBottom: space[2] },
  scrollContent: { gap: space[3], paddingBottom: space[16] },
  actions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
