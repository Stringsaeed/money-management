import { router } from "expo-router";

import { EmptyState, Screen } from "@/ui/trove";

import { setupHref } from "./setup-routes";
import { SetupHeader } from "./setup-header";

/** Shown when a later step is opened without a payday, for example after clearing app data. */
export function SetupRestart({ target }: { readonly target: string | null }) {
  return (
    <Screen>
      <SetupHeader />
      <EmptyState
        title="Start with your payday"
        message="Pick when you get paid and we will take it from there."
        actionLabel="Choose payday"
        onAction={() => router.replace(setupHref("payday", target))}
        framed={false}
      />
    </Screen>
  );
}
