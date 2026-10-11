import { router } from "expo-router";

import { EmptyState, Screen } from "@/ui/trove";

import { envelopeLines } from "../home/home-model";
import { SetupHeader } from "../setup/setup-header";

import { LeftoversContent } from "./leftovers-content";
import { leftoverTotal } from "./leftovers-model";
import { PAYDAY_ROUTES } from "./payday-flow";
import { PaydayGate } from "./payday-gate";

/** C2: Leftovers. Hidden (skipped over) when Everyday rolled nothing over. */
export function LeftoversScreen() {
  return (
    <PaydayGate title="Leftovers">
      {(view) =>
        leftoverTotal(envelopeLines(view)) > 0 ? (
          <LeftoversContent view={view} />
        ) : (
          <Screen>
            <SetupHeader title="Leftovers" />
            <EmptyState
              title="No leftovers"
              message="Nothing rolled over from your Everyday envelopes."
              actionLabel="Plan your new month"
              onAction={() => router.replace(PAYDAY_ROUTES.plan)}
              framed={false}
            />
          </Screen>
        )
      }
    </PaydayGate>
  );
}
