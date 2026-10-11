import { router } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, Header, layout, Screen, space, Text } from "@/ui/trove";

import { BudgetActive } from "./budget-active";
import { BudgetIntro } from "./budget-intro";
import { SETUP_STEP_ROUTES } from "./setup/setup-routes";
import { useSetupDraft } from "./setup/use-setup-draft";

/** The Budget tab: the intro while there is no budget, a placeholder once there is one. */
export function BudgetTabScreen() {
  const budget = useBudgetQuery();
  const setup = useSetupDraft();

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Budget" />
        {budget.isError && !budget.data ? (
          <EmptyState
            title="Couldn't load your budget"
            message="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => void budget.retry()}
            framed={false}
          />
        ) : !budget.data || !setup.ready ? (
          <Text tone="secondary" variant="bodySm">
            Loading your budget…
          </Text>
        ) : budget.data.budget ? (
          <BudgetActive view={budget.data} />
        ) : (
          <BudgetIntro
            hasDraft={setup.exists}
            onStart={() =>
              router.push(SETUP_STEP_ROUTES[setup.exists ? setup.draft.step : "payday"])
            }
            onNotNow={() => router.navigate("/(tabs)/(home)")}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[4],
    paddingBottom: space[16] + space[8],
    paddingHorizontal: layout.screenGutter,
  },
});
