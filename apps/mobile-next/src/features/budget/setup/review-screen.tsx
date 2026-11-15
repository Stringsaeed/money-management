import { router } from "expo-router";

import { useLedgerData } from "@/data/ledger-queries";

import { ReviewActions } from "./review-actions";
import { ReviewNotes } from "./review-notes";
import { ReviewReceipt } from "./review-receipt";
import { buildActivateInput, groupCounts } from "./setup-plan";
import { SetupRestart } from "./setup-restart";
import { SetupStatus } from "./setup-status";
import { SetupStepScreen } from "./setup-step-screen";
import { StepTitle } from "./step-title";
import { useSetupModel } from "./use-setup-model";
import { useStartBudget } from "./use-start-budget";

/** S5: the numbers the budget starts with, and the single Start budget action. */
export function ReviewScreen() {
  const model = useSetupModel();
  const { currency, target, needsPayday, draft, setup, facts, ticked, funding, preview } = model;
  const { scope } = useLedgerData();
  const starter = useStartBudget(() => {
    setup.clear();
    router.dismissTo("/(tabs)/envelopes");
  });

  if (needsPayday) return <SetupRestart step="review" target={target} />;
  if (facts.isError && !facts.data) {
    return (
      <SetupStatus
        step="review"
        error={{ title: "Couldn't calculate", onRetry: () => void facts.retry() }}
      />
    );
  }
  if (!facts.data || !preview || !draft.payday) {
    return <SetupStatus step="review" loading="Working out your budget…" />;
  }

  const payday = draft.payday;
  return (
    <SetupStepScreen step="review">
      <StepTitle title="Here's your month" />
      <ReviewReceipt
        currency={currency}
        preview={preview}
        period={facts.data.period}
        counts={groupCounts(ticked)}
        household={scope.kind === "household"}
      />
      <ReviewNotes
        periodStart={facts.data.period.start}
        safeToSpendMinor={preview.safeToSpendMinor}
        ticked={ticked}
        paydayReminder={draft.paydayReminder}
        payday={payday}
      />
      <ReviewActions
        pending={starter.pending}
        error={starter.error}
        blocked={preview.leftToPlanMinor < 0 || model.invalidAmounts || ticked.length === 0}
        onStart={() =>
          void starter.start(buildActivateInput(draft, payday, funding, ticked, currency))
        }
      />
    </SetupStepScreen>
  );
}
