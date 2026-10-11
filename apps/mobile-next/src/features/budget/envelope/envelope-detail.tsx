import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { useTransactionPagesQuery } from "@/data/transaction-list-queries";
import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { hasCardSpending } from "./envelope-model";
import { EnvelopeMenuButton } from "./envelope-menu-button";
import { EnvelopeMenuSheet } from "./envelope-menu-sheet";
import { EnvelopeSummary } from "./envelope-summary";
import { EnvelopeTransactions } from "./envelope-transactions";
import { GROUP_LABEL } from "./group-panel";
import { OverBanner } from "./over-banner";
import { WhySection } from "./why-section";

interface EnvelopeDetailProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
}

/** M4 with O1: one envelope's plan against what happened, and what to do when it is over. */
export function EnvelopeDetail({ view, line }: EnvelopeDetailProps) {
  const { envelope, totals } = line;
  const [menu, setMenu] = useState({ open: false, session: 0 });
  const coverMove = useCoverMoveRequest();
  const categories = useCategoriesQuery();
  const accounts = useAccountsQuery();
  const hasCategories = envelope.categoryIds.length > 0;
  const list = useTransactionPagesQuery(
    {
      categoryIds: envelope.categoryIds,
      kinds: ["expense"],
      from: view.current.period.start,
      to: view.current.period.end,
    },
    // An empty category filter would list every transaction.
    { enabled: hasCategories },
  );
  const categoriesById = new Map(categories.data.map((category) => [category.id, category]));
  const over = totals.leftMinor < 0;

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
        {over ? (
          <OverBanner
            overMinor={-totals.leftMinor}
            group={envelope.group}
            onCard={hasCardSpending(list.data, accounts.data)}
            onCover={() => coverMove.show({ kind: "cover", targetId: envelope.id })}
          />
        ) : null}
        <EnvelopeSummary line={line} daysLeft={view.current.daysLeft} />
        <Button
          title="Move money"
          variant="secondary"
          onPress={() => coverMove.show({ kind: "move", fromId: envelope.id })}
        />
        {over ? <WhySection transactions={list.data} categories={categoriesById} /> : null}
        {hasCategories ? (
          <EnvelopeTransactions list={list} categories={categoriesById} />
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
      <CoverMoveSheet controller={coverMove} view={view} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[5], padding: spacing[5], paddingBottom: spacing[10] },
  heading: { gap: spacing[1] },
});
