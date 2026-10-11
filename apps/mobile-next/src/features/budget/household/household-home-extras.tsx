import { useLedgerData } from "@/data/ledger-queries";

import { HouseholdSharePrompt } from "./household-share-prompt";
import { RecentActivity } from "./recent-activity";

/** What a household Budget home adds to the personal one: who moved money, and the share opt-in. */
export function HouseholdHomeExtras() {
  const { scope } = useLedgerData();
  if (scope.kind !== "household") return null;
  return (
    <>
      <RecentActivity />
      <HouseholdSharePrompt />
    </>
  );
}
