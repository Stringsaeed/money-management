import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { track } from "@/features/analytics";
import { useAccountsQuery } from "@/data/ledger-queries";
import { Button, ListGroup, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import { periodLabel } from "../envelope/envelope-model";
import type { ActiveBudgetView } from "../home/home-model";
import { SetupFrame } from "../setup/setup-frame";

import { BalanceCheck } from "./balance-check";
import { OverspendRow, type OverspendResolution } from "./overspend-row";
import { nextPaydayStep, paydayFlowFacts } from "./payday-flow";
import { RaiseCard } from "./raise-card";
import { salaryAccounts } from "./got-paid-model";
import { StatRow } from "./stat-row";
import type { WrapUp } from "./use-wrap-up";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

interface WrapUpContentProps {
  readonly view: ActiveBudgetView;
  readonly wrapUp: Extract<WrapUp, { status: "ready" }>;
}

/** C1: last month at a glance, read-only apart from Cover now and the balance Adjust. */
export function WrapUpContent({ view, wrapUp }: WrapUpContentProps) {
  const { summary, suggestion, firstMonth } = wrapUp;
  const accounts = useAccountsQuery();
  const coverMove = useCoverMoveRequest();
  const [resolved, setResolved] = useState<Readonly<Record<string, OverspendResolution>>>({});
  const resolve = (id: string, resolution: OverspendResolution) =>
    setResolved((current) => ({ ...current, [id]: resolution }));
  const next = (skipped: boolean) => {
    track("month_wrapup_completed", { skipped });
    router.replace(nextPaydayStep("wrapUp", paydayFlowFacts(view)));
  };

  const range = periodLabel({ start: wrapUp.periodStart, end: wrapUp.periodEnd });
  const title = firstMonth
    ? "Your first month"
    : `On plan in ${summary.onPlanCount} of ${summary.envelopeCount} envelopes`;

  return (
    <SetupFrame
      header="Month wrap-up"
      step={`Month wrap-up · ${range}`}
      title={title}
      intro={
        firstMonth
          ? "Only spending after you started counts, so this month may be short."
          : undefined
      }
      footer={
        <>
          <Button fullWidth label="Next" onPress={() => next(false)} />
          <Button fullWidth label="Skip" variant="tertiary" onPress={() => next(true)} />
        </>
      }
    >
      <ListGroup dividerInset={0}>
        <StatRow
          label="Everyday spent"
          value={`${money(summary.everyday.spentMinor)} of ${money(summary.everyday.plannedMinor)}`}
          warn={summary.everyday.spentMinor > summary.everyday.plannedMinor}
        />
        {firstMonth ? null : (
          <>
            <StatRow label="Bills paid" value={`${summary.bills.paid} of ${summary.bills.total}`} />
            <StatRow label="Saved for big payments" value={money(summary.savedMinor)} />
          </>
        )}
      </ListGroup>

      {summary.overspent.length > 0 ? (
        <View style={styles.section}>
          <Text variant="titleMd">Overspent</Text>
          <Text variant="bodySm" tone="secondary">
            Overspending is never covered for you. Accepting leaves it out of this month&apos;s
            envelopes: it already came out of your money to plan.
          </Text>
          {summary.overspent.map((item) => (
            <OverspendRow
              key={item.id}
              item={item}
              resolution={resolved[item.id]}
              onCover={() =>
                coverMove.show({
                  kind: "cover-past",
                  targetId: item.id,
                  amountMinor: item.overMinor,
                })
              }
              onAccept={() => resolve(item.id, "accepted")}
            />
          ))}
        </View>
      ) : null}

      {suggestion && !firstMonth ? <RaiseCard suggestion={suggestion} /> : null}

      <BalanceCheck accounts={salaryAccounts(accounts.data, view.fundingAccountIds)} />

      <CoverMoveSheet
        controller={coverMove}
        view={view}
        onCovered={(id) => resolve(id, "covered")}
      />
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
});
