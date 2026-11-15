import { router } from "expo-router";

import { track } from "@/features/analytics";
import { ActionBar } from "@/ui/trove";

import { AmountsPlan } from "./amounts-plan";
import { setupHref } from "./setup-routes";
import { SetupRestart } from "./setup-restart";
import { SetupStatus } from "./setup-status";
import { SetupStepScreen } from "./setup-step-screen";
import { useSetupModel } from "./use-setup-model";

/** S4: a monthly amount per envelope, with Left to plan updating on every keystroke. */
export function AmountsScreen() {
  const model = useSetupModel();
  const { target, needsPayday, setup, facts, preview, invalidAmounts } = model;

  if (needsPayday) return <SetupRestart step="amounts" target={target} />;
  if (facts.isError && !facts.data) {
    return (
      <SetupStatus
        step="amounts"
        error={{ title: "Couldn't calculate", onRetry: () => void facts.retry() }}
      />
    );
  }
  if (!facts.data) return <SetupStatus step="amounts" loading="Working out what you have…" />;

  const left = preview?.leftToPlanMinor ?? null;
  return (
    <SetupStepScreen
      step="amounts"
      gap={14}
      footer={
        <ActionBar
          note="You can change any of this later."
          primary={{
            label: "Review",
            disabled: left === null || left < 0 || invalidAmounts,
            onPress: () => {
              setup.update({ step: "review" });
              track("budget_setup_step_completed", { step: "amounts" });
              router.push(setupHref("review", target));
            },
          }}
        />
      }
    >
      <AmountsPlan model={model} />
    </SetupStepScreen>
  );
}
