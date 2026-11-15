import { router } from "expo-router";
import { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBudgetQuery } from "@/data/ledger-queries";
import { track } from "@/features/analytics";
import { layout, Screen } from "@/ui/trove";

import { BudgetIntro } from "./budget-intro";
import { BudgetLoadError } from "./budget-load-error";
import { BudgetHeader } from "./home/budget-header";
import { BudgetHome } from "./home/budget-home";
import { BudgetHomeLoading } from "./home/budget-home-loading";
import { stampDate } from "./home/budget-stamp";
import { useBudgetRole } from "./role/use-budget-role";
import { setupHref } from "./setup/setup-routes";
import { useSetupDraft } from "./setup/use-setup-draft";

/** Board top padding 58 less the 47pt status bar: the header sits 11pt under the safe area. */
const TOP_GAP = 11;
/** The floating tab bar plus the board's room above it (padding-bottom 130 = 34 inset + 96). */
const TAB_BAR_CLEARANCE = 96;
/** The board's gap between the header and the first section. */
const SECTION_GAP = 18;

const openDue = () => router.push("/budget/due");

/** The Budget tab: the intro while there is no budget, Budget home once there is one. */
export function BudgetTabScreen() {
  const budget = useBudgetQuery();
  const setup = useSetupDraft();
  const { canEditPlan, loading: roleLoading } = useBudgetRole();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const retry = () => void budget.retry();
  const active = budget.data?.budget ? budget.data : null;

  return (
    <Screen edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {budget.isError && !budget.data ? (
          <View style={styles.column}>
            <BudgetHeader bell={{ count: 0, onPress: openDue }} stamp={stampDate(new Date())} />
            <BudgetLoadError stale={false} onRetry={retry} />
          </View>
        ) : budget.isError && active ? (
          <BudgetHome
            key={active.budget.currency}
            onRetry={retry}
            scrollToY={(y) => scrollRef.current?.scrollTo({ y, animated: true })}
            stale
            view={active}
          />
        ) : !budget.data || !setup.ready ? (
          <BudgetHomeLoading stamp={stampDate(new Date())} />
        ) : active ? (
          <BudgetHome
            key={active.budget.currency}
            onRetry={retry}
            scrollToY={(y) => scrollRef.current?.scrollTo({ y, animated: true })}
            view={active}
          />
        ) : (
          <BudgetIntro
            hasDraft={setup.exists}
            canStart={canEditPlan}
            roleLoading={roleLoading}
            onStart={() => {
              if (!setup.exists) track("budget_setup_started", {});
              router.push(setupHref(setup.exists ? setup.draft.step : "payday", null));
            }}
            onNotNow={() => router.navigate("/(tabs)/(home)")}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenGutter, paddingTop: TOP_GAP },
  column: { gap: SECTION_GAP },
});
