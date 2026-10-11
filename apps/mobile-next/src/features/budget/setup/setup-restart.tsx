import { router } from "expo-router";

import { EmptyState, Screen } from "@/ui/trove";

import { SetupHeader } from "./setup-header";

/** Shown when a later step is opened without a payday, for example after clearing app data. */
export function SetupRestart() {
  return (
    <Screen>
      <SetupHeader />
      <EmptyState
        title="Start with your payday"
        message="Pick when you get paid and we will take it from there."
        actionLabel="Choose payday"
        onAction={() => router.replace("/budget/setup/payday")}
        framed={false}
      />
    </Screen>
  );
}
