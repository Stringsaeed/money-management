import { router } from "expo-router";

import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";

/** Shown when a later step is opened without a payday, for example after clearing app data. */
export function SetupRestart() {
  return (
    <Screen edges={["bottom"]}>
      <EmptyState
        title="Start with your payday"
        message="Pick when you get paid and we will take it from there."
        action={{ label: "Choose payday", onPress: () => router.replace("/budget/setup/payday") }}
      />
    </Screen>
  );
}
