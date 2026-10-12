import { router } from "expo-router";

import { useLedgerData } from "@/data/ledger-queries";
import { track } from "@/features/analytics";
import { ActionBar } from "@/ui/trove";

import { HouseholdPaydayStep } from "./household-payday-step";
import { PersonalPaydayStep } from "./personal-payday-step";
import { moneyLabel } from "./setup-copy";
import { setupHref } from "./setup-routes";
import { SetupStatus } from "./setup-status";
import { SetupStepScreen } from "./setup-step-screen";
import { usePaydayStep } from "./use-payday-step";

/** S2 (H2 for a household): payday and the money to plan with. */
export function PaydayScreen() {
  const step = usePaydayStep();
  const { scope } = useLedgerData();
  const { accounts, currency, target } = step;

  if (accounts.isError && accounts.data.length === 0) {
    return (
      <SetupStatus
        step="payday"
        error={{ title: "Couldn't load your accounts", onRetry: () => void accounts.retry() }}
      />
    );
  }

  return (
    <SetupStepScreen
      step="payday"
      footer={
        <ActionBar
          summary={{ label: "MONEY TO PLAN", value: moneyLabel(step.moneyMinor, currency) }}
          primary={{
            label: "Next",
            disabled: !step.canContinue,
            onPress: () => {
              step.update({ step: "items" });
              track("budget_setup_step_completed", { step: "payday" });
              router.push(setupHref("items", target));
            },
          }}
        />
      }
    >
      {scope.kind === "household" ? (
        <HouseholdPaydayStep step={step} />
      ) : (
        <PersonalPaydayStep step={step} />
      )}
    </SetupStepScreen>
  );
}
