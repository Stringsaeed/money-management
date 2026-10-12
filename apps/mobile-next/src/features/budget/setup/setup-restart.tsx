import { router } from "expo-router";

import { EmptyState } from "@/ui/trove";

import { setupHref } from "./setup-routes";
import { SetupStepScreen } from "./setup-step-screen";
import type { SetupStep } from "./setup-types";

interface SetupRestartProps {
  readonly step: SetupStep;
  readonly target: string | null;
}

/** Shown when a later step is opened without a payday, for example after clearing app data. */
export function SetupRestart({ step, target }: SetupRestartProps) {
  return (
    <SetupStepScreen step={step}>
      <EmptyState
        title="Start with your payday"
        message="Pick when you get paid and we will take it from there."
        actionLabel="Choose payday"
        onAction={() => router.replace(setupHref("payday", target))}
        framed={false}
      />
    </SetupStepScreen>
  );
}
