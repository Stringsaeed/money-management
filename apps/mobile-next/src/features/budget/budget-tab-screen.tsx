import { router } from "expo-router";
import { useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, Header, layout, Screen, space } from "@/ui/trove";

import { BudgetIntro } from "./budget-intro";
import { BudgetHome } from "./home/budget-home";
import { BudgetHomeError } from "./home/budget-home-error";
import { BudgetHomeSkeleton } from "./home/budget-home-skeleton";
import { SETUP_STEP_ROUTES } from "./setup/setup-routes";
import { useSetupDraft } from "./setup/use-setup-draft";

/** The Budget tab: the intro while there is no budget, Budget home once there is one. */
export function BudgetTabScreen() {
  const budget = useBudgetQuery();
  const setup = useSetupDraft();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <Screen edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Budget" />
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
