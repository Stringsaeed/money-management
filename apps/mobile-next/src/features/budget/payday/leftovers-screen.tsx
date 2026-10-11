import { router } from "expo-router";

import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";

import { envelopeLines } from "../home/home-model";

import { LeftoversContent } from "./leftovers-content";
import { leftoverTotal } from "./leftovers-model";
import { PAYDAY_ROUTES } from "./payday-flow";
import { PaydayGate } from "./payday-gate";

/** C2: Leftovers. Hidden (skipped over) when Everyday rolled nothing over. */
export function LeftoversScreen() {
  return (
    <PaydayGate>
      {(view) =>
        leftoverTotal(envelopeLines(view)) > 0 ? (
          <LeftoversContent view={view} />
        ) : (
          <Screen edges={["bottom"]}>
            <EmptyState
              title="No leftovers"
              message="Nothing rolled over from your Everyday envelopes."
              action={{
                label: "Plan your new month",
                onPress: () => router.replace(PAYDAY_ROUTES.plan),
              }}
            />
          </Screen>
        )
      }
    </PaydayGate>
  );
}
