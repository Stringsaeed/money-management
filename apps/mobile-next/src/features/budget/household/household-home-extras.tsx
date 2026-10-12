import type { LayoutChangeEvent } from "react-native";

import { useLedgerData } from "@/data/ledger-queries";

import { HouseholdSharePrompt } from "./household-share-prompt";
import { RecentActivity } from "./recent-activity";

interface HouseholdHomeExtrasProps {
  /** Where Recent activity sits, for the attention slot's Activity pill. */
  readonly onActivityLayout?: (event: LayoutChangeEvent) => void;
}

/** What a household Budget home adds to the personal one: who moved money, and the share opt-in. */
export function HouseholdHomeExtras({ onActivityLayout }: HouseholdHomeExtrasProps) {
  const { scope } = useLedgerData();
  if (scope.kind !== "household") return null;
  return (
    <>
      <RecentActivity onLayout={onActivityLayout} />
      <HouseholdSharePrompt />
    </>
  );
}
