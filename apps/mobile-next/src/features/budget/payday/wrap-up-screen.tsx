import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import type { ActiveBudgetView } from "../home/home-model";

import { nextPaydayStep, paydayFlowFacts } from "./payday-flow";
import { PaydayGate } from "./payday-gate";
import { useWrapUp } from "./use-wrap-up";
import { WrapUpContent } from "./wrap-up-content";

/** C1: Month wrap-up, the first step after Got paid when a month has just ended. */
export function WrapUpScreen() {
  return <PaydayGate>{(view) => <WrapUpLoader view={view} />}</PaydayGate>;
}

function WrapUpLoader({ view }: { readonly view: ActiveBudgetView }) {
  const wrapUp = useWrapUp(view);
  if (wrapUp.status === "ready") return <WrapUpContent view={view} wrapUp={wrapUp} />;
  return (
    <Screen edges={["bottom"]}>
      {wrapUp.status === "loading" ? (
        <Text variant="caption" style={styles.status}>
          Loading last month…
        </Text>
      ) : (
        <EmptyState
          title="Couldn't load last month"
          message="Nothing is lost. You can skip the wrap-up and plan your new month."
          action={{
            label: "Skip",
            onPress: () => router.replace(nextPaydayStep("wrapUp", paydayFlowFacts(view))),
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { padding: spacing[5] },
});
