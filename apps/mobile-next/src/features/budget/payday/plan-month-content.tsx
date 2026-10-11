import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { track } from "@/features/analytics";
import { Amount, Button, showToast, space, Text } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { PLAN_ADMIN_ONLY } from "../role/budget-role";
import { SetupFrame } from "../setup/setup-frame";

import { BUDGET_HOME_ROUTE } from "./payday-flow";
import { PlanGroups } from "./plan-groups";
import { pluralEnvelopes, RepeatCard } from "./repeat-card";
import { usePlanMonth } from "./use-plan-month";

/**
 * C3: plan the new month with the money you have; Repeat last month's plan is one atomic batch.
 * Repeat sets plan amounts, so only someone who can edit the plan sees it.
 */
export function PlanMonthContent({ view }: { readonly view: ActiveBudgetView }) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const month = usePlanMonth(view);
  const { plan, lastMonth, repeatAccess } = month;
  const { unassignedMinor } = view.current;
  const offerRepeat = repeatAccess === "offered";

  const finish = () => router.dismissTo(BUDGET_HOME_ROUTE);
  const repeat = async () => {
    if (!(await month.repeat())) return;
    track("plan_repeated", {});
    showToast({
      message: `Planned ${money(plan.totalMinor)} across ${pluralEnvelopes(plan.items.length)}`,
    });
    finish();
  };

  return (
    <SetupFrame
      header="Plan new month"
      step="Plan new month"
      title="Money to plan"
      intro="Only money you have counts. Your expected salary is never planned before it lands."
      footer={
        <>
          <PanelError message={month.error} />
          {offerRepeat ? (
            <Button
              fullWidth
              label="Repeat last month's plan"
              loading={month.busy}
              disabled={lastMonth !== "ready" || !plan.canRepeat}
              onPress={() => void repeat()}
            />
          ) : null}
          <Button
            fullWidth
            label={offerRepeat ? "Plan later" : "Done"}
            variant={offerRepeat ? "tertiary" : "primary"}
            onPress={finish}
          />
        </>
      }
    >
      <View accessible accessibilityLiveRegion="polite" style={styles.hero}>
        <Text tone="secondary" variant="labelSm">
          Money to plan
        </Text>
        <Amount
          currency={currency}
          minor={unassignedMinor}
          size="hero"
          tone={unassignedMinor < 0 ? "negative" : "primary"}
        />
        {unassignedMinor < 0 ? (
          <Text tone="negative" variant="bodySm">
            You&apos;ve planned or spent more than you have. Lower an envelope below.
          </Text>
        ) : null}
      </View>
      {offerRepeat && lastMonth !== "none" ? (
        <RepeatCard
          plan={plan}
          lastMonth={lastMonth}
          onRetry={() => void month.retryLastMonth()}
          onAdjust={finish}
        />
      ) : repeatAccess === "refused" ? (
        <Text tone="secondary" variant="bodySm">
          {PLAN_ADMIN_ONLY}
        </Text>
      ) : null}
      <PlanGroups lines={envelopeLines(view)} />
      <Text variant="bodySm" tone="secondary">
        Salary late? Plan with what you have now. You can plan more any time once it lands.
      </Text>
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space[1] },
});
