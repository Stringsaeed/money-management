import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import { envelopeLines } from "../home/home-model";

import { EnvelopeMenuButton } from "./envelope-menu-button";
import { EnvelopeMenuSheet } from "./envelope-menu-sheet";
import { EnvelopeSummary } from "./envelope-summary";
import { EnvelopeTransactions } from "./envelope-transactions";
import { GROUP_LABEL } from "./group-panel";

/** M4: one envelope's plan against what happened, with the advanced actions under •••. */
export function EnvelopeDetailScreen({ id }: { readonly id: string }) {
  const budget = useBudgetQuery();
  const [menu, setMenu] = useState({ open: false, session: 0 });
  const view = budget.data?.budget ? budget.data : null;
  const line = view ? envelopeLines(view).find((item) => item.envelope.id === id) : null;

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
  if (!view || !line) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState title="Envelope not found" message="It may have been archived." />
      </Screen>
    );
  }

  const { envelope } = line;
  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: envelope.name,
          headerRight: () => (
            <EnvelopeMenuButton
              onPress={() => setMenu((current) => ({ open: true, session: current.session + 1 }))}
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text variant="headline">{envelope.name}</Text>
          <Text variant="caption">{GROUP_LABEL[envelope.group]}</Text>
        </View>
        <EnvelopeSummary line={line} daysLeft={view.current.daysLeft} />
        {/* The Move money sheet arrives with the cover-and-move layer. */}
        <Button title="Move money" variant="secondary" disabled />
        {envelope.categoryIds.length > 0 ? (
          <EnvelopeTransactions categoryIds={envelope.categoryIds} period={view.current.period} />
        ) : (
          <Text variant="caption">
            No category is mapped to this envelope. Add one under More actions to count spending.
          </Text>
        )}
      </ScrollView>
      <EnvelopeMenuSheet
        open={menu.open}
        session={menu.session}
        view={view}
        line={line}
        onDismiss={() => setMenu((current) => ({ ...current, open: false }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[5], padding: spacing[5], paddingBottom: spacing[10] },
  heading: { gap: spacing[1] },
  status: { padding: spacing[5] },
});
