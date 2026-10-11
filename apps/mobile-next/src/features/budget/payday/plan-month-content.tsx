import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast";
import { formatMoneyMinor } from "@/utils/money";

import { PanelError } from "../envelope/panel-error";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { SetupFrame } from "../setup/setup-frame";

import { BUDGET_HOME_ROUTE } from "./payday-flow";
import { PlanGroups } from "./plan-groups";
import { pluralEnvelopes, RepeatCard } from "./repeat-card";
import { usePlanMonth } from "./use-plan-month";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** C3: plan the new month with the money you have; Repeat last month's plan is one atomic batch. */
export function PlanMonthContent({ view }: { readonly view: ActiveBudgetView }) {
  const month = usePlanMonth(view);
  const { plan } = month;
  const { unassignedMinor } = view.current;

  const finish = () => router.dismissTo(BUDGET_HOME_ROUTE);
  const repeat = async () => {
    if (!(await month.repeat())) return;
    showToast({
      message: `Planned ${money(plan.totalMinor)} across ${pluralEnvelopes(plan.items.length)}`,
    });
    finish();
  };

  return (
    <SetupFrame
      step="Plan new month"
      title="Money to plan"
      intro="Only money you have counts. Your expected salary is never planned before it lands."
      footer={
        <>
          <PanelError message={month.error} />
          {month.hasLastMonth ? (
            <Button
              title="Repeat last month's plan"
              loading={month.busy}
              disabled={month.isLoading || !plan.canRepeat}
              onPress={() => void repeat()}
            />
          ) : null}
          <Button
            title={month.hasLastMonth ? "Plan later" : "Done"}
            variant={month.hasLastMonth ? "ghost" : "primary"}
            onPress={finish}
          />
        </>
      }
    >
      <View accessible accessibilityLiveRegion="polite" style={styles.hero}>
        <Text variant="label">Money to plan</Text>
        <Text variant="amount" style={unassignedMinor < 0 && styles.over}>
          {money(unassignedMinor)}
        </Text>
        {unassignedMinor < 0 ? (
          <Text variant="caption" style={styles.over}>
            You&apos;ve planned or spent more than you have. Lower an envelope below.
          </Text>
        ) : null}
      </View>
      {month.hasLastMonth ? <RepeatCard plan={plan} onAdjust={finish} /> : null}
      <PlanGroups lines={envelopeLines(view)} />
      <Text variant="caption">
        Salary late? Plan with what you have now. You can plan more any time once it lands.
      </Text>
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing[1] },
  over: { color: colors.terracotta },
});
