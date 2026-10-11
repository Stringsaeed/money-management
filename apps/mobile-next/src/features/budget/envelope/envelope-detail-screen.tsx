import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { Button, EmptyState, Header, layout, Screen, space, Text } from "@/ui/trove";

import { envelopeLines } from "../home/home-model";

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
  const back = () => router.back();

  if (budget.isError && !line) {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Envelope" onBack={back} />
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
        <Header variant="compact" title="Envelope" onBack={back} />
        <Text style={styles.status} tone="secondary" variant="bodySm">
          Loading envelope…
        </Text>
      </Screen>
    );
  }
  if (!view || !line) {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Envelope" onBack={back} />
        <EmptyState
          title="Envelope not found"
          message="It may have been archived."
          framed={false}
        />
      </Screen>
    );
  }

  const { envelope } = line;
  return (
    <Screen style={styles.screen}>
      <Header
        variant="compact"
        title={envelope.name}
        onBack={back}
        actions={[
          {
            icon: "more",
            label: "More actions",
            onPress: () => setMenu((current) => ({ open: true, session: current.session + 1 })),
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text variant="titleLg">{envelope.name}</Text>
          <Text tone="secondary" variant="bodySm">
            {GROUP_LABEL[envelope.group]}
          </Text>
        </View>
        <EnvelopeSummary line={line} daysLeft={view.current.daysLeft} />
        {/* The Move money sheet arrives with the cover-and-move layer. */}
        <Button fullWidth label="Move money" variant="secondary" disabled />
        {envelope.categoryIds.length > 0 ? (
          <EnvelopeTransactions categoryIds={envelope.categoryIds} period={view.current.period} />
        ) : (
          <Text tone="secondary" variant="bodySm">
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
  screen: { paddingHorizontal: layout.screenGutter },
  content: { gap: space[5], paddingBottom: space[10], paddingTop: space[3] },
  heading: { gap: space[1] },
  status: { paddingVertical: space[5] },
});
