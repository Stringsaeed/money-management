import { router } from "expo-router";

import { ReviewActions } from "./review-actions";
import { ReviewSummary } from "./review-summary";
import { buildActivateInput } from "./setup-plan";
import { SetupFrame } from "./setup-frame";
import { SetupRestart } from "./setup-restart";
import { SetupStatus } from "./setup-status";
import { useSetupModel } from "./use-setup-model";
import { useStartBudget } from "./use-start-budget";

/** S5: the numbers the budget starts with, and the single Start budget action. */
export function ReviewScreen() {
  const {
    currency,
    target,
    needsPayday,
    draft,
    setup,
    facts,
    ticked,
    funding,
    preview,
    invalidAmounts,
  } = useSetupModel();
  const starter = useStartBudget(() => {
    setup.clear();
    router.dismissTo("/(tabs)/envelopes");
  });

  if (needsPayday) return <SetupRestart target={target} />;
  if (facts.isError && !facts.data) {
    return (
      <SetupStatus error={{ title: "Couldn't calculate", onRetry: () => void facts.retry() }} />
    );
  }
  if (!facts.data || !preview || !draft.payday) {
    return <SetupStatus loading="Working out your budget…" />;
  }

  const payday = draft.payday;
  return (
    <SetupFrame
      step="Review"
      title="Ready to start"
      footer={
        <ReviewActions
          pending={starter.pending}
          error={starter.error}
          blocked={preview.leftToPlanMinor < 0 || invalidAmounts || ticked.length === 0}
          onStart={() =>
            void starter.start(buildActivateInput(draft, payday, funding, ticked, currency))
          }
        />
      }
    >
      <ReviewSummary currency={currency} preview={preview} periodStart={facts.data.period.start} />
    </SetupFrame>
  );
}
