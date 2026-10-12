import { router } from "expo-router";

import { EmptyState } from "@/ui/trove";

import { envelopeLines } from "../home/home-model";

import { LeftoversContent } from "./leftovers-content";
import { leftoverTotal } from "./leftovers-model";
import { PAYDAY_ROUTES } from "./payday-flow";
import { PaydayGate } from "./payday-gate";
import { closePaydayFlow } from "./payday-nav";
import { PaydayStepFrame } from "./payday-step-frame";

/** C2: Leftovers. Hidden (skipped over) when Everyday rolled nothing over. */
export function LeftoversScreen() {
  return (
    <PaydayGate tag="LEFTOVERS">
      {(view) =>
        leftoverTotal(envelopeLines(view)) > 0 ? (
          <LeftoversContent view={view} />
        ) : (
          <PaydayStepFrame leading="close" onLeading={closePaydayFlow} tag="LEFTOVERS">
            <EmptyState
              title="No leftovers"
              message="Nothing rolled over from your Everyday envelopes."
              actionLabel="Plan your new month"
              onAction={() => router.replace(PAYDAY_ROUTES.plan)}
              framed={false}
            />
          </PaydayStepFrame>
        )
      }
    </PaydayGate>
  );
}
