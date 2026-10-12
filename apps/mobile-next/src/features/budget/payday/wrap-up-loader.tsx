import { router } from "expo-router";

import { EmptyState, Text } from "@/ui/trove";

import type { ActiveBudgetView } from "../home/home-model";

import { nextPaydayStep, paydayFlowFacts, paydayStepPosition } from "./payday-flow";
import { stepLeading } from "./payday-nav";
import { PaydayStepFrame } from "./payday-step-frame";
import { useWrapUp } from "./use-wrap-up";
import { WrapUpContent } from "./wrap-up-content";

/** Loads the period that just ended; it can be skipped when it can't be read. */
export function WrapUpLoader({ view }: { readonly view: ActiveBudgetView }) {
  const wrapUp = useWrapUp(view);
  if (wrapUp.status === "ready") return <WrapUpContent view={view} wrapUp={wrapUp} />;
  const facts = paydayFlowFacts(view);
  const position = paydayStepPosition("wrapUp", facts);
  return (
    <PaydayStepFrame
      {...stepLeading(position.first)}
      gap={14}
      of={position.of}
      step={position.step}
      tag="WRAP-UP"
    >
      {wrapUp.status === "loading" ? (
        <Text accessibilityLiveRegion="polite" tone="secondary" variant="bodySm">
          Loading last month…
        </Text>
      ) : (
        <EmptyState
          title="Couldn't load last month"
          message="Nothing is lost. You can skip the wrap-up and plan your new month."
          actionLabel="Skip"
          onAction={() => router.replace(nextPaydayStep("wrapUp", facts))}
          framed={false}
        />
      )}
    </PaydayStepFrame>
  );
}
