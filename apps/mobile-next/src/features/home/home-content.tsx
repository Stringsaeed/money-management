import { router } from "expo-router";
import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { motion, troveTransition } from "@/ui/trove";

import { HomeFlowCard } from "./home-flow-card";
import { HomeNetWorth } from "./home-net-worth";
import { HomePlanCard } from "./home-plan-card";
import { HomeSafeToSpend } from "./home-safe-to-spend";
import { HomeUpcoming } from "./home-upcoming";
import type { HomeData } from "./use-home-data";

interface HomeContentProps {
  readonly home: HomeData;
  readonly onOpenDue: () => void;
}

const openBudget = () => router.navigate("/(tabs)/envelopes");

/** The loaded board: net worth, the budget slip or its invitation, the chart, and what is due. */
export function HomeContent({ home, onOpenDue }: HomeContentProps) {
  const reducedMotion = useReducedMotion();
  const { budget } = home;
  return (
    <EaseView
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: reducedMotion ? 0 : 6 }}
      style={styles.sections}
      transition={troveTransition(reducedMotion, motion.slow)}
    >
      <HomeNetWorth
        balanceMinor={home.netWorth.balanceMinor}
        currency={home.currency}
        deltaMinor={home.netWorth.deltaMinor}
      />
      {budget.kind === "active" ? (
        <HomeSafeToSpend
          currency={budget.currency}
          daysLeft={budget.daysLeft}
          onPress={openBudget}
          perDayMinor={budget.perDayMinor}
          safeToSpendMinor={budget.safeToSpendMinor}
          ticks={budget.ticks}
        />
      ) : budget.kind === "none" ? (
        <HomePlanCard onPress={openBudget} />
      ) : null}
      <HomeFlowCard
        currency={home.currency}
        months={home.months}
        onViewChange={home.setChartView}
        view={home.chartView}
      />
      <HomeUpcoming
        currency={home.currency}
        failed={home.upcomingError}
        loading={home.upcomingLoading}
        items={home.upcoming}
        onOpen={(id) => router.push({ pathname: "/recurring/[id]", params: { id } })}
        onSeeAll={onOpenDue}
      />
    </EaseView>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 18 },
});
