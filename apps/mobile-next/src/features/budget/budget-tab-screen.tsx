import { router } from "expo-router";
import { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { track } from "@/features/analytics";
import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, Header, layout, Screen, space } from "@/ui/trove";

import { BudgetIntro } from "./budget-intro";
import { BudgetScopeLabel } from "./household/budget-scope-label";
import { useBudgetRole } from "./role/use-budget-role";
import { BudgetHome } from "./home/budget-home";
import { BudgetHomeError } from "./home/budget-home-error";
import { BudgetHomeSkeleton } from "./home/budget-home-skeleton";
import { SETUP_STEP_ROUTES } from "./setup/setup-routes";
import { useSetupDraft } from "./setup/use-setup-draft";

/** The Budget tab: the intro while there is no budget, Budget home once there is one. */
export function BudgetTabScreen() {
  const budget = useBudgetQuery();
  const setup = useSetupDraft();
  const { canEditPlan } = useBudgetRole();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Header title="Budget" />
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BudgetScopeLabel />
        {budget.isError && !budget.data ? (
          <EmptyState
            title="Couldn't load your budget"
            message="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => void budget.retry()}
            framed={false}
          />
        ) : budget.isError && budget.data?.budget ? (
          <BudgetHomeError onRetry={() => void budget.retry()} />
        ) : !budget.data || !setup.ready ? (
          <BudgetHomeSkeleton />
        ) : budget.data.budget ? (
          <BudgetHome
            view={budget.data}
            scrollToY={(y) => scrollRef.current?.scrollTo({ y, animated: true })}
          />
        ) : (
          <BudgetIntro
            hasDraft={setup.exists}
            canStart={canEditPlan}
            onStart={() => {
              if (!setup.exists) track("budget_setup_started", {});
              router.push(SETUP_STEP_ROUTES[setup.exists ? setup.draft.step : "payday"]);
            }}
            onNotNow={() => router.navigate("/(tabs)/(home)")}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenGutter },
  content: {
    gap: space[4],
    paddingBottom: space[16] + space[8],
    paddingHorizontal: layout.screenGutter,
  },
});
