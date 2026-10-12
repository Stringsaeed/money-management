import { router } from "expo-router";

import { useLedgerData } from "@/data/ledger-queries";
import { StepHeader } from "@/ui/trove";

import { stepHeaderProps } from "./setup-steps";
import type { SetupStep } from "./setup-types";

/** Back disc, three segments and the "1 / 3" tag ("🏠 1 / 3" for a household); Review has no bar. */
export function SetupStepHeader({ step }: { readonly step: SetupStep }) {
  const { scope } = useLedgerData();
  return (
    <StepHeader
      leading="back"
      onLeading={() => router.back()}
      {...stepHeaderProps(step, scope.kind === "household")}
    />
  );
}
