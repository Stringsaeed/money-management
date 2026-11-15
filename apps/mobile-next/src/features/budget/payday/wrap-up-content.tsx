import { router } from "expo-router";
import { useState } from "react";

import { track } from "@/features/analytics";
import { useAccountsQuery } from "@/data/ledger-queries";
import { ActionBar } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import type { ActiveBudgetView } from "../home/home-model";

import { BalanceCheck } from "./balance-check";
import { salaryAccounts } from "./got-paid-model";
import { OverspendRow, type OverspendResolution } from "./overspend-row";
import { periodStamp } from "./payday-copy";
import { nextPaydayStep, paydayFlowFacts, paydayStepPosition } from "./payday-flow";
import { stepLeading } from "./payday-nav";
import { PaydayStepFrame } from "./payday-step-frame";
import { RaiseCard } from "./raise-card";
import { StepTitle } from "./step-title";
import type { WrapUp } from "./use-wrap-up";
import { WrapUpReceipt } from "./wrap-up-receipt";

interface WrapUpContentProps {
  readonly view: ActiveBudgetView;
  readonly wrapUp: Extract<WrapUp, { status: "ready" }>;
}

/** C1: last month at a glance, read-only apart from Cover, Accept and the balance Adjust. */
export function WrapUpContent({ view, wrapUp }: WrapUpContentProps) {
  const currency = useBudgetCurrency();
  const { summary, suggestion, firstMonth } = wrapUp;
  const accounts = useAccountsQuery();
  const coverMove = useCoverMoveRequest();
  const [resolved, setResolved] = useState<Readonly<Record<string, OverspendResolution>>>({});
  const resolve = (id: string, resolution: OverspendResolution) =>
    setResolved((current) => ({ ...current, [id]: resolution }));
  const facts = paydayFlowFacts(view);
  const position = paydayStepPosition("wrapUp", facts);
  // Pushed, so Back on the next step returns here with every Cover and Accept as it was.
  const next = (skipped: boolean) => {
    track("month_wrapup_completed", { skipped });
    router.push(nextPaydayStep("wrapUp", facts));
  };

  return (
    <PaydayStepFrame
      {...stepLeading(position.first)}
      footer={
        <ActionBar
          primary={{ label: "Next", onPress: () => next(false) }}
          secondary={{ label: "Skip", appearance: "text", onPress: () => next(true) }}
        />
      }
      gap={14}
      of={position.of}
      step={position.step}
      tag="WRAP-UP"
    >
      <StepTitle
        meta={periodStamp({ start: wrapUp.periodStart, end: wrapUp.periodEnd })}
        note={
          firstMonth
            ? "Only spending after you started counts, so this month may be short."
            : undefined
        }
        title="Your month, wrapped"
      />
      <WrapUpReceipt currency={currency} firstMonth={firstMonth} summary={summary} />
      {summary.overspent.map((item) => (
        <OverspendRow
          currency={currency}
          item={item}
          key={item.id}
          onAccept={() => resolve(item.id, "accepted")}
          onCover={() =>
            coverMove.show({ kind: "cover-past", targetId: item.id, amountMinor: item.overMinor })
          }
          resolution={resolved[item.id]}
        />
      ))}
      {suggestion && !firstMonth ? <RaiseCard currency={currency} suggestion={suggestion} /> : null}
      <BalanceCheck
        accounts={salaryAccounts(accounts.data, view.fundingAccountIds, view.budget.currency)}
      />
      <CoverMoveSheet
        controller={coverMove}
        onCovered={(id) => resolve(id, "covered")}
        view={view}
      />
    </PaydayStepFrame>
  );
}
